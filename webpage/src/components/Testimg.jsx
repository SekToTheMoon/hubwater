import React, { useState, useEffect } from "react";
import statusOptions from "../constants/statusOptions.js";

const userRole = "admin"; // ตัวอย่าง: กำหนดบทบาทของผู้ใช้
const initialStatus = "รออนุมัติ"; // ตัวอย่าง: สถานะเริ่มต้นของเอกสาร

const Testimg = () => {
  const [status, setStatus] = useState(initialStatus);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    updateOptions(status);
  }, [status]);

  const updateOptions = (currentStatus) => {
    switch (currentStatus) {
      case "รออนุมัติ":
        setOptions(statusOptions[1].proposal[userRole]);
        break;
      case "อนุมัติ":
        setOptions(statusOptions[1].approved[userRole]);
        break;
      case "ดำเนินการแล้ว":
        setOptions(statusOptions[1].processed[userRole]);
        break;
      default:
        setOptions([]);
    }
  };

  const handleChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    updateOptions(newStatus);
  };

  return (
    <div>
      <h1>สถานะปัจจุบัน: {status}</h1>
      <select
        value={status}
        aria-placeholder="รออนุมติ"
        onChange={handleChange}
      >
        {options.map((option, index) => (
          <option
            key={index}
            value={option}
            className={option == status ? "hide" : ""}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Testimg;
