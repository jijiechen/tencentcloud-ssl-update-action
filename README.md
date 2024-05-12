# Update certificates for Tencent Cloud products

GitHub Actions to update certificate for multiple Tencent Cloud products, including CDN, CLB, API Gateway, etc

该 Action 可以为腾讯云 CDN、CLB 和 API Gateway 产品更新证书。

## Inputs

- secret_id(**Required**): Tencent cloud secret id. Should be referred to a encrypted environment variable
- secret_key(**Required**): Tencent cloud secret key. Should be referred to a encrypted environment variable


## 输入



## Demo

```
- name: Tencent COS and CDN
  uses: sylingd/tencent-cos-and-cdn-action@latest
  with:
    secret_id: YOUR_SECRET_ID
    secret_key: YOUR_SECRET_KEY
    cos_bucket: bucket-12345678
    cos_region: ap-shanghai
    cos_accelerate: false
    cdn_prefix: https://cdn.example.com/scripts/
    local_path: path/to/files
    remote_path: /scripts
    clean: false
```