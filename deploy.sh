#!/bin/bash
set -e

aws s3 sync ./dist/spa/ s3://spoileralert-tv.com

#Push to CloudFront - MHD: Not sure how this works yet
#aws cloudfront create-invalidation --distribution-id E2NHFUIB0TXJ5Z --paths '/*'
