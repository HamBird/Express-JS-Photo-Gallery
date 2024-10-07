const express = require('express');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const multer = require('multer');
// const bodyParser = require('body-parser');

const app = express();

// const storage = multer.diskStorage({
//   destination: __dirname + '/files/images',
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const baseName = path.basename(file.originalname, ext);
//     cb(null, generateUniqueName(baseName, ext));
//   }
// });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + "/files/images")
  },
  filename: function(req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, generateUniqueName(baseName, ext));
  },
});

//const upload = multer({ dest: __dirname + '/files/uploads', limits: { fileSize: 50 * 1024 * 1024 } });// 50 MB limit for files});
const upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb) {
    const mimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if(mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    }
    else {
      return cb(new Error("Only image files are allowed:"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});


const port = 3000;

app.use( require('express').json() );
// app.use(bodyParser.json({ limit: '50mb' }));
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the 'css' directory
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/javascript', express.static(path.join(__dirname, 'javascript')));

// Serve static files from the 'html' directory
app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/files', express.static(path.join(__dirname, 'files')));


app.get('/images', (req, res) => {
  const imagesDirectory = path.join(__dirname, 'files', 'images');
  fs.readdir(imagesDirectory, (err, files) => {
    if (err) {
      return res.status(500).json( { error: "Unable to read directory" } );
    }
    // sends images inside given directory using filter
    // **** should change the pattern as user can potentially fool the filter by having a fake extension (test.png.txt)
    res.json(files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)).map(file => {
      const filepath = path.join(__dirname, 'files', 'images', file);
      // retrieves file info
      const stats = fs.statSync(filepath);
      //console.log(`Name of file: ${file}, Creation Date: ${stats.birthtime}`);
      return {
        name: file,
        modifiedDate: stats.mtime,
        size: stats.size
      };
    }));
  });
});

app.get('/download-image/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  const filepath = path.join(__dirname, 'files', 'images', imageName);

  console.log(`Entered Download Code, Filepath given: ${filepath}`);

  res.download(filepath, (err) => {
    if(err) {
      res.status(500).json( {error: "Unable to download image"} );
    }
  });
});

// app.get('/download-images/:images', (req, res) => {
//   const images = req.params.images.split(',');
//   console.log(images);
// });

app.post('/download-images/images', (req, res) => {
  console.log(req.body);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  const output = fs.createWriteStream(path.join(__dirname, "pictures.zip"));
  archive.pipe(output);

  req.body.forEach(file => {
    archive.file(path.join(__dirname, 'files', 'images', file), { name: file});
  });

  archive.finalize();

  output.on('close', () => {
    res.download(path.join(__dirname, "pictures.zip"), "pictures.zip", (err) => {
      if(err) {
        console.error("Error downloading archive:", err);
      }
      fs.unlinkSync(path.join(__dirname, "pictures.zip"));
    });
  });
});

// Set the Content-Type header based on file extension
app.get('/', (req, res) => {
    res.statusCode = 200;
    const filePath = path.join(__dirname, 'html', 'home.html');
    //console.log(path.join(__dirname, 'js'));
    //const extension = path.extname(filePath).toLowerCase().slice(1);
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(filePath);
});

app.post('/upload-images/images', upload.array("file"), (req, res) => {
  if(req.files && req.files.length !== 0) {
    console.log(req.files);
    if(req.files.length > 1) {
      return res.json({status: `Uploaded ${req.files.length} Files!`});
    }
    return res.json({status: `Uploaded ${req.files[0].originalname}!`})
  }
  else {
    return res.json( { error: "Unable to upload File!" } );
  }
});

app.use((err, req, res, next) => {
  if(err) {
    // res.status(400).send(err.message);
    console.log(err.message);
  }
});

app.post('/delete/images', async (req, res) => {
  console.log(req.body);
  const toBeDeletedImages = req.body;
  var filesDeleted = 0;

  if(toBeDeletedImages.length < 1) {
    return res.json({error: "No files selected!"});
  }

  for(var images of toBeDeletedImages) {
    filesDeleted += await deleteFile(images);
  }

  if(toBeDeletedImages.length > 1) {
    return res.json({status: `Deleted ${filesDeleted} out of ${toBeDeletedImages.length} Files!`});
  }
  return res.json({status: `Deleted ${toBeDeletedImages[0]}`});
});

async function deleteFile(imageName) {
  const filepath = path.join(__dirname, "files", "images", imageName);
  try {
    await fs.promises.unlink(filepath);
    console.log("File Deleted!");
    return 1;
  }
  catch ( err ) {
    console.log(err.message);
    return 0;
  }
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(`App Link: http://localhost:${port}`);
});

// Check this function to make sure it makes a new name
function generateUniqueName(filename, extension) {
  var name = `${filename}${extension}`;
  for(let i = 1; ;i++) {
    if(fs.existsSync(path.join('/files/images', name))) {
      name = `${filename}(${i})${extension}`;
    }
    else {
      break;
    }
  }
  return name;
}