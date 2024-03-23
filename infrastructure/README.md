## AWS環境構築手順

1. AWSアカウントを用意
2. IAMでterraform用のユーザーをAdministratorAccessで作成
3. S3のバケットにterraformのstate保持用のバケットを用意
   (backend.tfに記載しているバケット名と一致している必要があります)
4. aws/environments/各環境/.envに上記のAWS認証情報を記載

```
cp aws/environments/各環境/.env.sample aws/environments/各環境/.env
```

5. terraform初期化
   ※下記コマンド内でterraformのDockerイメージを使用していますのでDockerがインストールされていることを確認してください。

```
aws/bin/terraform_stg init (ステージング環境の場合)
aws/bin/terraform_prod init (本番環境の場合)
```

6. 反映

```
aws/bin/terraform_stg apply
aws/bin/terraform_prod apply
```

実行時に差分が表示されるので問題無さそうであれば`yes`を入力

※ 環境によってlambdaのファイル名などは変更してください。

## 参考資料

- [terraform.io](https://www.terraform.io/)

## ECRにイメージプッシュ

※ テスト段階でECRにプッシュする方法のサンプルです。

1. tag付け

```
docker tag affiliate-stg-nginx:latest 053413723692.dkr.ecr.ap-northeast-1.amazonaws.com/affiliate-stg-nginx:latest
```

2. ECRログイン

```
export AWS_ACCESS_KEY_ID=xxxx && export AWS_SECRET_ACCESS_KEY=xxxx && aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin 053413723692.dkr.ecr.ap-northeast-1.amazonaws.com
```

3. プッシュ

```
docker push 053413723692.dkr.ecr.ap-northeast-1.amazonaws.com/affiliate-stg-nginx:latest
```
