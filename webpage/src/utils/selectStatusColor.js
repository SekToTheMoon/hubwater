function selectStatusColor(status) {
  const statusColors = {
    รออนุมัติ: "border-info bg-info/10",
    ไม่อนุมัติ: "border-warning bg-warning/10",
    ยกเลิก: "border-error bg-error/10",
    อนุมัติ: "border-success bg-success/10",
    รอเก็บเงิน: "border-info bg-info/10",
    รอจ่ายเงิน: "border-info bg-info/10",
  };
  return statusColors[status] || "border-default"; // สี default ถ้า status ไม่ตรงกับที่กำหนดไว้
}

export default selectStatusColor;
