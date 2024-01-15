const express = require("express");
const multer = require('multer');
const cors = require("cors");
const { google } = require('googleapis');
const { user } = require("./models");
const fs = require('fs');

const UPLOADS_FOLDER = './uploads';


const storage = multer.diskStorage({
  destination: UPLOADS_FOLDER,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());
const GOOGLE_API_FOLDER_ID = "1xh_JAOk1tXbrfPatCtNMhSFqm6P0Jlg2";

app.use(express.json());
app.use("/files", express.static(UPLOADS_FOLDER));

app.post("/user", upload.single('img'), async function (req, res) {
  try {
    const { name, email, password } = req.body;
    console.log(name, email, password);
    const link = await uploadFile(name, req.file.path);
    const novoUsuario = await user.create({ name, email, password, img: link });

    res.json(novoUsuario);
  } catch (err) {
    console.error('Error creating user', err);
    res.status(500).json({ error: 'Error creating user' });
  }
});

async function uploadFile(name, filePath) {
  try {
    const time = new Date().getTime();
    const auth = new google.auth.GoogleAuth({
      keyFile: './drive.json',
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const driveService = google.drive({
      version: 'v3',
      auth
    });

    const fileMetaData = {
      'name': `${name}${time}.jpg`,
      'parents': [GOOGLE_API_FOLDER_ID]
    };

    const media = {
      mimeType: 'image/jpg',
      body: fs.createReadStream(filePath)
    };

    const response = await driveService.files.create({
      resource: fileMetaData,
      media: media,
      field: 'id'
    });

    const linkImagem = `https://drive.google.com/uc?export=view&id=${response.data.id}`;

    return linkImagem;
  } catch (err) {
    console.error('Error uploading the file', err);
    throw err;
  }
}

// Create 'uploads' folder if not exists
if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER);
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


