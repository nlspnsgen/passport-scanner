/* eslint func-names: ["error", "never"] */
(function () {
  // Injecting text into website
  const strong = document.getElementsByTagName('strong')[0];
  const div = document.createElement('div');
  const content = document.getElementById('content');
  div.style.cssText = 'background-color: black; color: white; padding-left: 5px';
  div.innerHTML = '<div><h style="font-weight: bold">Niels Passport Scanner</h> <p> Press 1 and click on the passport frontside. Press 2 and click on the passport backside </p></div>';
  content.insertBefore(div, strong);

  // Variables we generate
  let idVerificationDone;
  let adressVerificationDone;
  let keyNum;
  let passPortFrontText;
  let passPortBackText;

  // Variables from website
  const htmlStreetName = document.getElementsByName('street')[0].value;
  const htmlFirstName = document.getElementsByName('first_name')[0].value;
  const htmlLastName = document.getElementsByName('last_name')[0].value;
  const htmlBirthDate = document.getElementsByName('birth_date')[0].value;


  const getHtmlExpirationFields = () => {
    const textFields = [].slice.call(document.getElementsByClassName('vTextField'));
    const expirationFields = textFields.filter((textField) => textField.name.includes('expiration_issue_date'));
    return expirationFields;
  };


  const fillExpirationFields = (expirationDate) => {
    document.getElementsByName(getHtmlExpirationFields()[0].name)[0].value = expirationDate;
    document.getElementsByName(getHtmlExpirationFields()[1].name)[0].value = expirationDate;
  };

  const verifyBirthday = (birthDate) => (birthDate === htmlBirthDate);

  const verifyAdress = () => passPortBackText.toUpperCase().includes(htmlStreetName.toUpperCase());

  const verifyName = () => (passPortBackText.toUpperCase().includes(htmlFirstName.toUpperCase())
            && passPortBackText.toUpperCase().includes(htmlLastName.toUpperCase()));

  // Returns date past 2020 from String
  const getExpirationDate = (text) => {
    const result = text.match(/[0-9]{2}\.[0-9]{2}\.20[2-9][0-9]/g);
    return result[0];
  };

  // Returns any date up until 2001 from String
  const getBirthDate = (text) => {
    const result = text.match(/[0-9]{2}\.[0-9]{2}\.(200(0|1)|1[0-9]{3})/g);
    return result[0];
  };

  const getBackCode = (text) => {
    const result = text.match(/[0-9]{7}[A-Z][0-9]{7}./g);
    return result[0];
  };

  const verifyBackCode = (backCode, birthDate, expirationDate) => {
    // expirationDate is in format: 12.12.2002
    // birthDate is in Format: 01.01.1977
    // backCode is in Format: 77 01 01 8F 02 12 12 6HRV
    const birthDateArray = birthDate.split('.');
    const expirationDateArray = expirationDate.split('.');
    const n1 = birthDateArray[2].slice(-2);
    const n2 = birthDateArray[1];
    const n3 = birthDateArray[0];
    const n4 = '..';
    const n5 = expirationDateArray[2].slice(-2);
    const n6 = expirationDateArray[1];
    const n7 = expirationDateArray[0];
    const backCodeRegEx = new RegExp(n1 + n2 + n3 + n4 + n5 + n6 + n7, 'igm');
    if (backCode.match(backCodeRegEx)) {
      return true;
    }
    return false;
  };

  // Detexts if a 1 or a 2 was pressed.
  document.onkeypress = function (evt) {
    const event = evt || window.event;
    const charCode = event.keyCode || event.which;
    const keyString = String.fromCharCode(charCode);
    if (keyString === '1' || keyString === '2') keyNum = parseInt(keyString, 10);
    console.log('keyNum onkeypress: ', keyNum);
  };

  const convertBoolToHtml = (attribute, b) => {
    if (b) return `<p >${attribute}: <span style="color:green; font-weight: bold">correct</span></p>`;
    return `<p> ${attribute}: <span style="color:red: font-weight: bold">false</span> </p>`;
  };

  const convertResultToHTML = (backCodeCorrect, birthDayCorrect, adressCorrect, nameCorrect) => {
    const backCode = convertBoolToHtml('Backcode', backCodeCorrect);
    const birthDate = convertBoolToHtml('Date Of Birth', birthDayCorrect);
    const adress = convertBoolToHtml('Adress', adressCorrect);
    const name = convertBoolToHtml('Name', nameCorrect);
    return `<h style="font-weight: bold">Niels Passport Scanner</h> ${backCode} ${birthDate} ${adress} ${name}`;
  };


  const verifyAll = () => {
    const expirationDate = getExpirationDate(passPortFrontText);
    const birthDate = getBirthDate(passPortFrontText);
    const backCode = getBackCode(passPortBackText);
    const backCodeCorrect = verifyBackCode(backCode, birthDate, expirationDate);
    const birthDayCorrect = verifyBirthday(birthDate);
    const adressCorrect = verifyAdress();
    const nameCorrect = verifyName();
    div.innerHTML = convertResultToHTML(
      backCodeCorrect, birthDayCorrect, adressCorrect, nameCorrect,
    );
    if (expirationDate && backCodeCorrect) {
      fillExpirationFields(expirationDate);
    }
  };

  const doOCR = (imageId, step) => {
    div.innerHTML = '<h style="font-weight: bold">Niels Passport Scanner</h> <p> loading... </p>';
    const image = document.getElementById(imageId);
    const { TesseractWorker } = Tesseract; //eslint-disable-line
    const worker = new TesseractWorker({
      workerPath: chrome.runtime.getURL('src/js/worker.min.js'),
      langPath: chrome.runtime.getURL('traineddata'),
      corePath: chrome.runtime.getURL('src/js/tesseract-core.wasm.js'),
    });

    worker
      .recognize(image, 'hrv+eng')
      .progress((info) => {
        console.log(info);
      })
      .then((result) => {
        if (step === 1) {
          passPortFrontText = result.text;
          idVerificationDone = true;
        }
        if (step === 2) {
          passPortBackText = result.text;
          adressVerificationDone = true;
        }
        if (idVerificationDone && adressVerificationDone) {
          verifyAll();
          keyNum = 0;
        }
      });
  };

  // Detects if an image was clicked on.
  document.addEventListener('click', (e) => {
    const event = e || window.event;
    if (keyNum === 1 || keyNum === 2) {
      const target = event.target || event.srcElement;
      if (target && target.tagName === 'IMG') {
        doOCR(target.id, keyNum);
      }
    }
  }, false);
}());
