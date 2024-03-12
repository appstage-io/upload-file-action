const core = require("@actions/core");
const axios = require("axios");
const https = require('https');
const fs = require('fs/promises');
const FormData = require('form-data');

const token = core.getInput('token');
const filename = core.getInput('filename');
const host = core.getInput('host') || 'https://www.appstage.io';

(async () => {
  try {
    const instance = axios.create({
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    });

    console.log(`Uploading ${filename}...`)

    const file = await fs.readFile(filename);
    let formData = new FormData();
    formData.append("release_file[cloud_stored_file]", file, filename);

    const { data } = await instance.post(`${host}/api/live_builds`, formData,{
      headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
          'Authorization': `Bearer ${token}`
      }
    });
    console.log(`File ${data.display_name} uploaded`)
    core.setOutput("file", data);
  } catch (error) {
    console.log(`File upload failed - ${error.message}`)
    core.setFailed(`File upload failed - ${error.message}`);
  }
})();
  