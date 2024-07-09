// src/constants/statusOptions.js
const statusOptions = [
  // ใบเสนอราคา 0
  {
    รออนุมัติ: {
      ลูกน้อง: ["รออนุมัติ"],
      หัวหน้า: ["รออนุมัติ", "อนุมัติ", "ไม่อนุมัติ"],
    },
    ไม่อนุมัติ: {
      ลูกน้อง: ["ไม่อนุมัติ", "แก้ไขใบเสนอราคา"],
      หัวหน้า: ["ไม่อนุมัติ", "อนุมัติ", "ยกเลิก"],
    },
    ยกเลิก: {
      ลูกน้อง: ["ยกเลิก"],
      หัวหน้า: ["ยกเลิก"],
    },
    อนุมัติ: {
      ลูกน้อง: ["อนุมัติ", "สร้างใบวางบิล", "สร้างใบแจ้งหนี้"],
      หัวหน้า: ["อนุมัติ", "สร้างใบวางบิล", "สร้างใบแจ้งหนี้", "ยกเลิก"],
    },
    ดำเนินการแล้ว: {
      ลูกน้อง: ["ดำเนินการแล้ว"],
      หัวหน้า: ["ดำเนินการแล้ว", "ยกเลิก"],
    },
  },
  // ใบวางบิล 1
  {
    รออนุมัติ: {
      ลูกน้อง: ["รออนุมัติ"],
      หัวหน้า: ["รออนุมัติ", "อนุมัติ", "ไม่อนุมัติ"],
    },
    ไม่อนุมัติ: {
      ลูกน้อง: ["ไม่อนุมัติ", "แก้ไขใบวางบิล"],
      หัวหน้า: ["ไม่อนุมัติ", "อนุมัติ", "ยกเลิก"],
    },
    ยกเลิก: {
      ลูกน้อง: ["ยกเลิก"],
      หัวหน้า: ["ยกเลิก"],
    },
    อนุมัติ: {
      ลูกน้อง: ["อนุมัติ", "สร้างใบแจ้งหนี้"],
      หัวหน้า: ["อนุมัติ", "สร้างใบแจ้งหนี้", "ยกเลิก"],
    },
    ดำเนินการแล้ว: {
      ลูกน้อง: ["ดำเนินการแล้ว"],
      หัวหน้า: ["ดำเนินการแล้ว", "ยกเลิก"],
    },
  },
  // ใบแจ้งหนี้ 2
  {
    รออนุมัติ: {
      ลูกน้อง: ["รออนุมัติ"],
      หัวหน้า: ["รออนุมัติ", "อนุมัติ", "ไม่อนุมัติ"],
    },
    ไม่อนุมัติ: {
      ลูกน้อง: ["ไม่อนุมัติ", "แก้ไขใบแจ้งหนี้"],
      หัวหน้า: ["ไม่อนุมัติ", "อนุมัติ", "ยกเลิก"],
    },
    ยกเลิก: {
      ลูกน้อง: ["ยกเลิก"],
      หัวหน้า: ["ยกเลิก"],
    },
    อนุมัติ: {
      ลูกน้อง: ["อนุมัติ", "สร้างใบเสร็จรับเงิน"],
      หัวหน้า: ["อนุมัติ", "สร้างใบเสร็จรับเงิน", "ยกเลิก"],
    },
    ดำเนินการแล้ว: {
      ลูกน้อง: ["ดำเนินการแล้ว"],
      หัวหน้า: ["ดำเนินการแล้ว", "ยกเลิก"],
    },
  },
  // ใบเสร็จรับเงิน 3
  {
    ยกเลิก: {
      ลูกน้อง: ["ยกเลิก"],
      หัวหน้า: ["ยกเลิก"],
    },
    รอเก็บเงิน: {
      ลูกน้อง: ["รอเก็บเงิน", "เก็บเงิน"],
      หัวหน้า: ["รอเก็บเงิน", "เก็บเงิน", "ยกเลิก"],
    },
    เก็บเงินแล้ว: {
      ลูกน้อง: ["เก็บเงินแล้ว"],
      หัวหน้า: ["เก็บเงินแล้ว", "ยกเลิก"],
    },
  },
  // ใบเสร็จรับเงิน สด 4
  {
    ยกเลิก: {
      ลูกน้อง: ["ยกเลิก"],
      หัวหน้า: ["ยกเลิก"],
    },
    รอเก็บเงิน: {
      ลูกน้อง: ["รอเก็บเงิน", "เก็บเงิน"],
      หัวหน้า: ["รอเก็บเงิน", "เก็บเงิน", "ยกเลิก"],
    },
    เก็บเงินแล้ว: {
      ลูกน้อง: ["เก็บเงินแล้ว"],
      หัวหน้า: ["เก็บเงินแล้ว", "ยกเลิก"],
    },
  },
  // เอกสารค่าใช้จ่าย 5
  {
    ไม่อนุมัติ: {
      ลูกน้อง: ["ไม่อนุมัติ"],
      หัวหน้า: ["ไม่อนุมัติ"],
    },
    รอจ่ายเงิน: {
      ลูกน้อง: ["รอจ่ายเงิน"],
      หัวหน้า: ["รอจ่ายเงิน", "จ่ายเงิน", "ไม่อนุมัติ"],
    },
    จ่ายแล้ว: {
      ลูกน้อง: ["จ่ายแล้ว"],
      หัวหน้า: ["จ่ายแล้ว", "ยกเลิก"],
    },
  },
];

export default statusOptions;
