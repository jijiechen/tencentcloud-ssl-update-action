# Update certificates for Tencent Cloud products

GitHub Actions to update certificate for multiple Tencent Cloud products, including CDN, CLB, API Gateway, etc. This action can only be used to update certificates, it does not turn on the HTTPS feature for a service that is currently don't have it turned on.

该 Action 可以为腾讯云 CDN、CLB 和 API Gateway 产品更新服务器证书，在使用之前，要求具体的产品在此前已启用 HTTPS（即只能更新证书，不能用于从未启用 HTTPS 切换为启用 HTTPS）

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
- `clb_id` The ID of the CLB, required when `cloud_service_type` is `clb`
- `clb_port` The port of the CLB, required when `cloud_service_type` is `clb`.
- `clb_protocol` The protocol of the CLB, required when `cloud_service_type` is `clb`.


## 输入参数

**必填**

- `secret_id` 腾讯云访问密钥 SecretID，请以 GitHub 密钥的形式保存值，再作为参数传入。
- `secret_key` 腾讯云访问密钥 SecretKey，请以 GitHub 密钥的形式保存值，再作为参数传入。
- `cloud_service_type` 云服务类型，目前支持的值有 `cdn`、`clb`、`apigateway`。
- `path_certificate` 证书文件的路径，`pem` 格式，请确保该文件含有完整的证书链。
- `path_private_key` 私钥文件的路径，`pem` 格式，请勿加密。

**在特定情况下必填**

- `region`: 腾讯云服务区域，如 `ap-shanghai`，当 `cloud_service_type` 值为 `clb`, `apigateway` 时必填。
- `domain` 域名名称，当 `cloud_service_type` 值为 `cdn`, `apigateway` 时必填。
- `apigw_service_id` API 网关的服务标识，当 `cloud_service_type` 值为 `apigateway` 时必填。
- `clb_id` CLB 实例的标识，当 `cloud_service_type` 值为 `clb` 时必填。
- `clb_port` CLB 侦听器的端口，当 `cloud_service_type` 值为 `clb` 时必填。
- `clb_protocol` CLB 侦听器的协议，当 `cloud_service_type` 值为 `clb` 时必填。

## 示例

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