'use strict';

const aws = require('aws-sdk');
const im = require('./imagemagick.js');
const fs = require('fs');
const path = require('path');
const s3 = new aws.S3({
    apiVersion: 'latest'
});

const convert = (req, context) => {

    let fileNamePath = decodeURIComponent(req.Records[0].s3.object.key.replace(/\+/g, ' '));
    const source_s3_bucket = req.Records[0].s3.bucket.name;
    const fileName = path.basename(fileNamePath);

    let defaultArgs = ['-trim'];

    const inputS3params = {
        Bucket: source_s3_bucket,
        Key: fileNamePath,
    };

    let file = '/tmp/' + fileName;

    defaultArgs.unshift(file);
    defaultArgs.push(file);

    s3.getObject(inputS3params, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            fs.writeFileSync(file, data.Body);

            im.convert(defaultArgs, (err) => {

                    if (err) throw err;

                    const outputS3params = {
                        Bucket: source_s3_bucket,
                        Body: fs.readFileSync(file),
                        Key: fileNamePath,
                        ContentType: 'image/jpeg'
                    };

                    s3.putObject(outputS3params, function (err) {
                        try {
                            fs.unlinkSync(file);
                        } catch (err) {
                            // Ignore
                        }

                        if (err) throw err;

                        context.success();

                    });

                }
            );

        }
    });
};

exports.handler = (event, context) => {
    convert(event, context);
};

