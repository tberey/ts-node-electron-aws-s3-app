import axios from 'axios';
import { SimpleTxtLogger } from 'simple-txt-logger';
import { HelperService } from '../HelperService';
import { ServerSetup } from '../../ServerSetup';

const txtLogger: SimpleTxtLogger = new SimpleTxtLogger(HelperService.newDateTime(), 'Client', ServerSetup.appName);
txtLogger.writeToLogFile('...::CLIENT-SIDE APPLICATION STARTING::...');

/* eslint-disable */
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('scriptTest')!.innerHTML = 'SUCCESS';
  txtLogger.writeToLogFile('Client Ready to Serve.');
  
  document.getElementById('list-buckets-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('list-buckets-submit')).disabled = true;
    document.getElementById('list-buckets-list')!.innerHTML = '';

    await axios.get('http://localhost:3000/listBuckets')
    .then(res => {
      console.log(`statusCode: ${res.status}`);
      res.data!.forEach((val: string) => {
        let node = document.createElement("TR");
        let text = document.createTextNode(val);
        node.appendChild(text); 
        document.getElementById('list-buckets-list')!.appendChild(node);
        (<HTMLInputElement>document.getElementById('list-buckets-submit')).disabled = false;
      });
    })
    .catch((err: Error) => {
      document.getElementById('list-buckets-list')!.innerHTML = 'Failed to List Buckets.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('list-buckets-submit')).disabled = false;
    });
  });

  document.getElementById('upload-file-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('upload-file-submit')).disabled = true;

    let bucket: string = (<HTMLInputElement>document.getElementById('upload-file-input-bucket')).value;
    let file: FileList | null = (<HTMLInputElement>document.getElementById('upload-file-input-file')).files;

    if (!file?.length) return;

    let payload: object = {  "bucket": bucket, "filePath": file!.item(0)!.path  };

    await axios.post('http://localhost:3000/uploadFile', payload)
    .then(res => {
      document.getElementById('upload-file-message')!.innerHTML = 'Successfully Uploaded File!';
      console.log(`statusCode: ${res.status}`);
      (<HTMLInputElement>document.getElementById('upload-file-input-bucket')).value = '';
      (<HTMLInputElement>document.getElementById('upload-file-input-file')).value = '';
      (<HTMLInputElement>document.getElementById('upload-file-submit')).disabled = false;
    })
    .catch((err: Error) => {
      document.getElementById('upload-file-message')!.innerHTML = 'Failed to Upload File.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('upload-file-input-bucket')).value = '';
      (<HTMLInputElement>document.getElementById('upload-file-input-file')).value = '';
      (<HTMLInputElement>document.getElementById('upload-file-submit')).disabled = false;
    });
  });

  document.getElementById('download-file-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('download-file-submit')).disabled = true;

    let bucket: string = (<HTMLInputElement>document.getElementById('download-file-input-bucket')).value;
    let file: string = (<HTMLInputElement>document.getElementById('download-file-input-object')).value;

    if (!file?.length) return;

    let payload: object = {  "bucket": bucket, "file": file  };

    await axios.post('http://localhost:3000/downloadFile', payload)
    .then(res => {
      document.getElementById('download-file-message')!.innerHTML = 'Successfully Downloaded File!';
      console.log(`statusCode: ${res.status}`);
      (<HTMLInputElement>document.getElementById('download-file-input-bucket')).value = '';
      (<HTMLInputElement>document.getElementById('download-file-input-object')).value = '';
      (<HTMLInputElement>document.getElementById('download-file-submit')).disabled = false;
    })
    .catch((err: Error) => {
      document.getElementById('download-file-message')!.innerHTML = 'Failed to Download File.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('download-file-input-bucket')).value = '';
      (<HTMLInputElement>document.getElementById('download-file-input-object')).value = '';
      (<HTMLInputElement>document.getElementById('download-file-submit')).disabled = false;
    });
  });

  document.getElementById('find-bucket-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('find-bucket-submit')).disabled = true;

    let bucket: string | null = (<HTMLInputElement>document.getElementById('find-bucket-input')).value;
    let payload: object = {  'bucket': bucket  };

    await axios.get('http://localhost:3000/findBucket', {  params: payload  })
    .then(res => {
      document.getElementById('find-bucket-message')!.innerHTML = 'Found Bucket!';
      console.log(`statusCode: ${res.status}`);
      (<HTMLInputElement>document.getElementById('find-bucket-input')).value = '';
      (<HTMLInputElement>document.getElementById('find-bucket-submit')).disabled = false;
    })
    .catch((err: Error) => {
      document.getElementById('find-bucket-message')!.innerHTML = 'Failed to Find Bucket.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('find-bucket-input')).value = '';
      (<HTMLInputElement>document.getElementById('find-bucket-submit')).disabled = false;
    });
  });

  document.getElementById('find-object-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('find-object-submit')).disabled = true;

    let bucket: string | null = (<HTMLInputElement>document.getElementById('find-object-input-bucket')).value;
    let object: string | null = (<HTMLInputElement>document.getElementById('find-object-input-object')).value;
    let payload: object = {  'bucket': bucket, 'object': object  };

    await axios.get('http://localhost:3000/findObject', {  params: payload  })
    .then(res => {
      document.getElementById('find-object-message')!.innerHTML = 'Found Object!';
      console.log(`statusCode: ${res.status}`);
      (<HTMLInputElement>document.getElementById('find-object-input-bucket')).value = '';
      (<HTMLInputElement>document.getElementById('find-object-input-object')).value = '';
      (<HTMLInputElement>document.getElementById('find-object-submit')).disabled = false;
    })
    .catch((err: Error) => {
      document.getElementById('find-object-message')!.innerHTML = 'Failed to Find Object.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('find-object-input-bucket')).value = '';
      (<HTMLInputElement>document.getElementById('find-object-input-object')).value = '';
      (<HTMLInputElement>document.getElementById('find-object-submit')).disabled = false;
    });
  });

  document.getElementById('create-bucket-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('create-bucket-submit')).disabled = true;

    let bucket: string | null = (<HTMLInputElement>document.getElementById('create-bucket-input')).value;
    let payload: object = {  "bucket": bucket  };

    await axios.post('http://localhost:3000/createBucket', payload)
    .then(res => {
      document.getElementById('create-bucket-message')!.innerHTML = 'Successfully Created Bucket!';
      console.log(`statusCode: ${res.status}`);
      (<HTMLInputElement>document.getElementById('create-bucket-input')).value = '';
      (<HTMLInputElement>document.getElementById('create-bucket-submit')).disabled = false;
    })
    .catch((err: Error) => {
      document.getElementById('create-bucket-message')!.innerHTML = 'Failed to Create Bucket.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('create-bucket-input')).value = '';
      (<HTMLInputElement>document.getElementById('create-bucket-submit')).disabled = false;
    });
  });

  document.getElementById('list-objects-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('list-objects-submit')).disabled = true;
    document.getElementById('list-objects-list')!.innerHTML = '';
    
    let bucket: string | null = (<HTMLInputElement>document.getElementById('list-objects-input')).value;
    if (!bucket) return;
    let payload: object = {  "bucket": bucket  };

    await axios.get('http://localhost:3000/listObjects', {  params: payload  })
    .then(res => {
      console.log(`statusCode: ${res.status}`);
      res.data!.forEach((val: string) => {
        let node = document.createElement("TR");
        let text = document.createTextNode(val);
        node.appendChild(text); 
        document.getElementById('list-objects-list')!.appendChild(node);
        (<HTMLInputElement>document.getElementById('list-objects-input')).value = '';
        (<HTMLInputElement>document.getElementById('list-objects-submit')).disabled = false;
      });
    })
    .catch((err: Error) => {
      document.getElementById('list-objects-list')!.innerHTML = 'Failed to List Objects.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('list-objects-input')).value = '';
      (<HTMLInputElement>document.getElementById('list-objects-submit')).disabled = false;
    });
  });

  document.getElementById('delete-bucket-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('delete-bucket-submit')).disabled = true;

    let bucket: string | null = (<HTMLInputElement>document.getElementById('delete-bucket-input')).value;
    if (!bucket) return;
    let payload: object = {  "bucket": bucket  };

    await axios.delete('http://localhost:3000/deleteBucket', {  data: payload  })
    .then(res => {
      document.getElementById('delete-bucket-message')!.innerHTML = 'Successfully Deleted Bucket!';
      console.log(`statusCode: ${res.status}`);
      (<HTMLInputElement>document.getElementById('delete-bucket-input')).value = '';
      (<HTMLInputElement>document.getElementById('delete-bucket-submit')).disabled = false;
    })
    .catch((err: Error) => {
      document.getElementById('delete-bucket-message')!.innerHTML = 'Failed to Delete Bucket.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('delete-bucket-input')).value = '';
      (<HTMLInputElement>document.getElementById('delete-bucket-submit')).disabled = false;
    });
  });

  document.getElementById('empty-bucket-submit')!.addEventListener('click', async () => {
    (<HTMLInputElement>document.getElementById('empty-bucket-submit')).disabled = true;

    let bucket: string | null = (<HTMLInputElement>document.getElementById('empty-bucket-input')).value;
    if (!bucket) return;
    let payload: object = {  "bucket": bucket  };

    await axios.delete('http://localhost:3000/emptyBucket', {  data: payload  })
    .then(res => {
      document.getElementById('empty-bucket-message')!.innerHTML = 'Successfully Emptied Bucket!';
      console.log(`statusCode: ${res.status}`);
      (<HTMLInputElement>document.getElementById('empty-bucket-input')).value = '';
      (<HTMLInputElement>document.getElementById('empty-bucket-submit')).disabled = false;
    })
    .catch((err: Error) => {
      document.getElementById('empty-bucket-message')!.innerHTML = 'Failed to Empty Bucket.';
      console.error(err);
      (<HTMLInputElement>document.getElementById('empty-bucket-input')).value = '';
      (<HTMLInputElement>document.getElementById('empty-bucket-submit')).disabled = false;
    });
  });
});
/* eslint-enable */