const express = require("express");
const { google } = require("googleapis");
const { check, validationResult } = require("express-validator");

const dateReg = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

const app = express();

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const validate = (condition) => {
  if (condition) console.log("error");
  else console.log("przeszło");
};

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/dist"));

app.get("/", (req, res) => {
  res.render("pages/index", {
    title: "Strona główna",
  });
});

app.get("/raport", (req, res) => {
  const spreadsheetId = req.query.id;
  res.render("pages/raport", {
    spreadsheetId,
    title: "Raport",
    formValue: "",
    errors: "",
  });
});

app.get("/ankieta", (req, res) => {
  const spreadsheetId = req.query.id;
  res.render("pages/ankieta", {
    spreadsheetId,
    title: "Ankieta",
    formValue: "",
    errors: "",
  });
});

app.get("/thank-you", (req, res) => {
  res.render("pages/thank-you", {
    title: "Dziękuję",
  });
});

app.get("*", (req, res, next) => {
  res.status(404).render("pages/404", {
    title: "Błąd 404",
  });
});

// Write data to spreadsheet Ankieta
app.post(
  "/ankieta",
  [
    check(["date"]).isDate().withMessage("To pole musi być datą"),
    check([
      "weight",
      "chest",
      "belly",
      "hips",
      "biceps",
      "bicepsSec",
      "thigh",
      "activity",
      "sleep",
      "training",
    ])
      .isNumeric()
      .withMessage("To pole musi zawierać liczbę"),
    check(["training"]).isFloat({ min: 2 }).withMessage("Minimum dwa treningi"),
    check(["pregnancy", "comments", "pain"])
      .optional({ checkFalsy: true })
      .isLength({ min: 3 })
      .withMessage("To pole musi zawierać conajmniej 3 znaki"),
    check(["comfort"])
      .isLength({ min: 3 })
      .withMessage("To pole musi zawierać conajmniej 3 znaki"),
  ],
  async (req, res) => {
    const {
      date,
      weight,
      activity,
      sleep,
      training,
      pain,
      comfort,
      comments,
      chest,
      belly,
      hips,
      biceps,
      bicepsSec,
      thigh,
      pregnancy,
      spreadsheetId,
    } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("pages/ankieta", {
        spreadsheetId,
        title: "Ankieta",
        formValue: req.body,
        errors: errors.mapped(),
      });
    }

    const basicData = [
      date,
      weight,
      activity,
      comfort,
      sleep,
      training,
      pain,
      comments,
    ];
    const size = [chest, belly, hips, biceps, bicepsSec, thigh];

    if (!spreadsheetId)
      return res.render("pages/error", {
        title: "Error",
        content: "Błąd wysyłania, skontaktuj się z administratorem aplikacji.",
      });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: "v4", auth: client });

    // Get sheet rows
    const getRows = await googleSheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Ankieta",
    });

    const rowsData = getRows.data.values;

    // Write data to spreadsheet Ankieta
    let ind = 0;
    basicData.map(async (el) => {
      let currentRow = 4 + ind;

      if (rowsData[currentRow] && rowsData[currentRow - 1].length === 0) {
        ind++;
        currentRow++;
      }

      ind++;

      await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: `Ankieta!E${currentRow}:G${currentRow}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [[el]],
        },
      });
    });

    // // Write sizes column
    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Ankieta!B23:G23",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [size],
      },
    });

    // Write pregnancy column
    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Ankieta!E27:G27",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[pregnancy]],
      },
    });

    res.redirect("/thank-you");
  }
);

// Write row(s) to spreadsheet Raporty
app.post(
  "/raport",
  [
    check(["date"]).isDate().withMessage("To pole musi być datą"),
    check(["weight", "chest", "belly", "hips", "biceps", "bicepsSec", "thigh"])
      .isNumeric()
      .withMessage("To pole musi zawierać liczbę"),

    check(["period", "comments"])
      .optional({ checkFalsy: true })
      .isLength({ min: 3 })
      .withMessage("To pole musi zawierać conajmniej 3 znaki"),
    check(["comfort"])
      .isLength({ min: 3 })
      .withMessage("To pole musi zawierać conajmniej 3 znaki"),
  ],
  async (req, res) => {
    const {
      date,
      weight,
      chest,
      belly,
      hips,
      biceps,
      bicepsSec,
      thigh,
      comfort,
      period,
      comments,
      spreadsheetId,
    } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("pages/raport", {
        spreadsheetId,
        title: "Raport",
        formValue: req.body,
        errors: errors.mapped(),
      });
    }

    const row = [
      date,
      weight,
      chest,
      belly,
      hips,
      biceps,
      bicepsSec,
      thigh,
      comfort,
      period,
      comments,
    ];

    if (!spreadsheetId)
      return res.render("pages/error", {
        title: "Error",
        content: "Błąd wysyłania, skontaktuj się z administratorem aplikacji.",
      });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: "v4", auth: client });

    // Write sizes row
    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Raporty!A1:K1",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [row],
      },
    });

    res.redirect("/thank-you");
  }
);

app.listen(2137, (req, res) => console.log("running on 2137"));
