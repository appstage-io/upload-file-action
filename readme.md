# Appstage.io Upload File Github Action

![GitHub Release](https://img.shields.io/github/v/release/appstage-io/upload-file-action)

Github action to ease uploading of a single file to [Appstage.io](https://www.appstage.io) project live builds.

## Usage

Add appstage-actions to the workflow to upload your new ipa or apk build to appstage. The below example builds an iOS installer using fastlane then deletes the previous ipa before uploading the new build to appstage.io:-

```yaml
name: "Build and Publish iOS"
on:
  push:
   branches: [ "master" ]

jobs:
  build:
    runs-on: macos-latest
    timeout-minutes: 30
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Update dependencies
        run: |
          bundle
          bundle update fastlane
          pod repo update

      - name: Build ipa with fastlane
        id: build_ipa
        run: bundle exec fastlane beta

      - name: List current files on Appstage.io
        uses: appstage-io/list-files-action@master
        with:
          token: ${{ secrets.APPSTAGE_JWT }}

      - name: Delete old ipa from Appstage.io
        uses: appstage-io/delete-files-action@master
        with:
          token: ${{ secrets.APPSTAGE_JWT }}
          pattern: '.ipa'

      - name: Deploy new ipa to Appstage.io
        uses: appstage-io/upload-file-action@master
        with:
          token: ${{ secrets.APPSTAGE_JWT }}
          filenam: './build/motorise.ipa'
```

## Upload file

### Description

Uploads a single file to the Live builds release on Appstage.io.

### Example

```yaml
- name: Deploy new ipa's to Appstage.io
  uses: Appstage-io/actions/upload-file@master
  with:
    token: ${{ secrets.APPSTAGE_JWT }}
    filename: './build/motorise.ipa'
```

### Inputs

| Input | Required? | Default | Description |
| ----- | --------- | ------- | ----------- |
| token | true | |Project Access Token|
| filename | true | | Filename including path of file to upload|

### Outputs

| Output | Description |
| ----- | ----------- |
| file | The uploaded file detail as JSON payload|

Example file output:-

```json
  {
    "id":"fbce383c-f455-4f05-8b78-9e6858c9c279",
    "name":"motorise.ipa",
    "created_at":"2024-03-11T16:10:18.017Z",
    "size":15395922
  }
```
