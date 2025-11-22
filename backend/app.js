const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const upload = multer({ dest: 'uploads/' });
const app = express();

app.use("/", express.static(path.join(__dirname, "../frontend")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.json({ status: "OK", uptime: process.uptime() });
});

app.post('/api/process',
    upload.fields([
        { name: 'mobileprovision', maxCount: 1 },
        { name: 'p12', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const mp = req.files['mobileprovision'][0];
            const p12 = req.files['p12'][0];
            const password = req.body.password || "";

            try {
                execSync(`openssl pkcs12 -in ${p12.path} -nokeys -password pass:${password}`, {
                    stdio: "ignore"
                });
            } catch {
                return res.status(400).json({ error: "Invalid P12 or wrong password" });
            }

            const zip = new AdmZip();
            zip.addLocalFile(mp.path, '', "validated.mobileprovision");
            zip.addLocalFile(p12.path, '', "certificate.p12");

            const passFile = `pass_${Date.now()}.txt`;
            fs.writeFileSync(passFile, password);
            zip.addLocalFile(passFile, '', "password.txt");

            const zipName = `PPQ_RESULT_${Date.now()}.zip`;
            const zipPath = path.join('uploads', zipName);
            zip.writeZip(zipPath);

            res.download(zipPath, zipName, () => {
                fs.unlinkSync(mp.path);
                fs.unlinkSync(p12.path);
                fs.unlinkSync(passFile);
                fs.unlinkSync(zipPath);
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PPQCheck running on port ${PORT}`));