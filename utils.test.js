const { getInfoFromCode, checkCode, isOldCode, isNewCode, formatCode } = require('./utils');

test(`checkCode returns 'false' for bad codes`, () => {
    expect(checkCode('abc')).toBeFalsy();
    expect(checkCode('abc-2019-abc-fr')).toBeFalsy();
    expect(checkCode('123')).toBeFalsy();
    // expect(checkCode('10002345678900')).toBeFalsy();
    expect(checkCode('123890')).toBeFalsy();
    expect(checkCode('1')).toBeFalsy();
    expect(checkCode('a-2019-1234-de')).toBeFalsy();
});

test(`checkCode returns 'true' for good codes`, () => {
    expect(checkCode(123456789)).toBeTruthy();
    expect(checkCode('123456789')).toBeTruthy();
    expect(checkCode(212019201)).toBeTruthy();

    expect(checkCode('abc-2019-1-fr')).toBeTruthy();
    expect(checkCode('abc-2019-12-fr')).toBeTruthy();
    expect(checkCode('abc-2019-123-fr')).toBeTruthy();
    expect(checkCode('abc-2019-1234-de')).toBeTruthy();
    expect(checkCode('abc-2019-12345-de')).toBeTruthy();
    expect(checkCode('abcd-2019-1234-de')).toBeTruthy();
});

test(`getInfoFromCode returns something for new code`, () => {
    const r = getInfoFromCode('abcd-2019-1234-de')
    expect(r).toBeTruthy();
    expect(r.dirCode).toBe('abcd')
    expect(r.yearCode).toBe('2019')
    expect(r.familyCode).toBe('1234')
    expect(r.langCode).toBe('de')
});

test(`getInfoFromCode returns something for old code`, () => {
    const r = getInfoFromCode('112019001')
    expect(r).toBeTruthy();
    expect(r.dirCode).toBe('11')
    expect(r.yearCode).toBe('2019')
    expect(r.familyCode).toBe('00')
    expect(r.langCode).toBe('1')
});

test(`getInfoFromCode returns nothing`, () => {
    expect(getInfoFromCode('abc-209-14-d')).toBeFalsy();
    expect(getInfoFromCode('123')).toBeFalsy();
});

test(`isOldCode test`, () => {
    expect(isOldCode('112019001')).toBeTruthy()
    expect(isOldCode('blah-1234-fr')).toBeFalsy()
})

test(`isNewCode test`, () => {
    expect(isNewCode('eco-2019-5539-fr')).toBeTruthy()
    expect(isNewCode('123456')).toBeFalsy()
})

test(`format code tests`, () => {
    expect(formatCode('eco-2019-5539-fr')).toBe('eco-2019-5539-fr.7z')
    expect(formatCode('012003083')).toBe('010308-3.7z')
})
