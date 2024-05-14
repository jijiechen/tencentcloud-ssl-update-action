# Update certificates for Tencent Cloud products

Please note that this project is not an official SDK from Tencent Cloud. Please use at your own risk.

GitHub Actions to update certificate for multiple Tencent Cloud products, including CDN, CLB, API Gateway, etc. This action can only be used to update certificates, it does not turn on the HTTPS feature for a service that is currently don't have it turned on. 

## Inputs

**Required**

- `secret_id` Tencent cloud secret id. Please provide the value from a secret.
- `secret_key` Tencent cloud secret key. Please provide the value from a secret.
- `cloud_service_type` The cloud service type you want to update certificate for. Supported values: `cdn`, `clb`, `apigateway`.
- `path_certificate` File path of the certificate, in `pem` format, make sure this file contains the full certificate chain.
- `path_private_key` File path of the private key, in `pem` format, not encrypted.

**Required conditionally**

- `region` Tencent cloud service region, required when `cloud_service_type` is `clb`, `apigateway`.
- `domain` Domain name for which to update SSL certificate, required when `cloud_service_type` is `cdn`, `apigateway`.
- `apigw_service_id` API Gateway service id, required when `cloud_service_type` is `apigateway`.
- `clb_id` The ID of the CLB, required when `cloud_service_type` is `clb`.
- `clb_port` The port of the CLB, required when `cloud_service_type` is `clb`.
- `clb_protocol` The protocol of the CLB, required when `cloud_service_type` is `clb`, possible values are TCP | UDP | HTTP | HTTPS | TCP_SSL | QUIC.

## Demo

```yaml
- name: Update cert
  uses: jijiechen/tencentcloud-ssl-update-action@master
  with:
    secret_id: YOUR_SECRET_ID
    secret_key: YOUR_SECRET_KEY
    cloud_service_type: cdn
    path_certificate: ./certs/server.pem
    path_private_key: ./certs/key.pem
    domain: abcd.example.com
```

## Thanks

This project is inspired by https://github.com/sylingd/tencent-cos-and-cdn-action