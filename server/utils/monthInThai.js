function getMonthInThai(monthIndex) {
  const thaiMonthAbbreviations = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  return thaiMonthAbbreviations[monthIndex];
}
module.exports = getMonthInThai;
