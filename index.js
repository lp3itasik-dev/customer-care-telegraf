require('dotenv').config();
const { BOT_TOKEN, CHAT, PORT } = process.env;
const ExcelJS = require('exceljs');
const express = require('express');
const cors = require('cors');
const moment = require('moment-timezone');
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { Complaint } = require('./models');
const verifyapikey = require('./middlewares/verifyapikey');

const app = express();

const bot = new Telegraf(BOT_TOKEN);

bot.on(message('text'), async (ctx) => {
  console.log(ctx.update.message);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  return res.send('Customer Care Backend LP3I 🇮🇩');
});

app.get('/reports', verifyapikey, async (req, res) => {
  try {
    const reports = await Complaint.findAll();
    return res.status(200).json(reports);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An error occurred on the server. Please try again later.",
    });
  }
});

app.get('/download', async (req, res) => {
  try {
    const reports = await Complaint.findAll();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Report of Customer Care`);
    sheet.addRow(['No.', 'Identity', 'Title', 'Category', 'Message', 'Datetime']);

    reports.forEach((result, index) => {
      const time = moment(result.createdAt).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');
      sheet.addRow([
        index + 1,
        `${result.identity}`,
        `${result.title}`,
        `${result.category}`,
        `${result.message}`,
        `${time}`,
      ]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="report-customer-care.xlsx"');

    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'An error occurred on the server. Please try again later.'
    });
  }
});

app.post('/', verifyapikey, async (req, res) => {
  try {
    let now = new Date();
    let localTime = now.getTime();
    let localOffset = now.getTimezoneOffset() * 60000;
    let gmtTime = localTime + localOffset + (7 * 3600000);
    let indonesiaTime = new Date(gmtTime);
    let formattedTime = indonesiaTime.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let name = req.body.name;
    let title = req.body.title;
    let target = CHAT;
    let category = req.body.category;
    let message = req.body.message;
    let messageSend = `[Pengaduan Baru!]\nKategori: Laporan dari ${category}\n\nNama lengkap: ${name}\nJudul: ${title}\nPesan: "${message}"\n\n\nDikirim secara otomatis oleh Sistem\n${formattedTime} WIB`;

    await bot.telegram.sendMessage(target, messageSend);
    let data = {
      identity: name,
      title: title,
      category: category,
      message: message
    }
    await Complaint.create(data);
    return res.json({
      status: true,
      message: "Your complaint has been sent successfully. Please wait for a response from our team.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "An error occurred on the server. Please try again later.",
    });
  }
});

app.delete('/:id', verifyapikey, async(req, res) => {
  try {
    const report = await Complaint.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({
        message: "Report not found.",
      });
    }
    await report.destroy();
    return res.json({
      message: "Report has been deleted successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "An error occurred on the server. Please try again later.",
    });
  }
});

bot.launch();

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))