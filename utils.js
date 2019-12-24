const oldOecdCodeRE = new RegExp(/([0-9]{2})([0-9]{4})([0-9]{2})([0-9]{1})/);
const newOecdCodeRE = new RegExp(/([a-z]{3,4})-([0-9]{4})-([0-9]{1,5})-([a-z]{2})/);
let a, dirCode, yearCode, familyCode, langCode;

const checkCode = (code) => {
    return oldOecdCodeRE.test(code) || newOecdCodeRE.test(code);
}

const getInfoFromCode = (code) => {
    if (oldOecdCodeRE.test(code)) {
        [a, dirCode, yearCode, familyCode, langCode] = oldOecdCodeRE.exec(code)
        return { dirCode, yearCode, familyCode, langCode };
    } else if (newOecdCodeRE.test(code)) {
        [a, dirCode, yearCode, familyCode, langCode] = newOecdCodeRE.exec(code)
        return { dirCode, yearCode, familyCode, langCode };
    }
}

module.exports = { checkCode, getInfoFromCode }
