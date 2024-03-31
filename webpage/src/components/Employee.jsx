import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";

function Employee() {
  const [employee, setEmployee] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalRows / perPage);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/employee?page=${currentPage}&per_page=${perPage}`
      );

      setEmployee(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, perPage]);

  return (
    <>
      <div className="overflow-x-auto">
        <h1 className="text-2xl mb-5">พนักงาน</h1>
        <div className="flex justify-between items-center mb-5">
          <Link to="insert" className="btn btn-accent">
            เพิ่มพนักงาน
          </Link>
        </div>
        <table className="table ">
          <thead className="text-gray-700">
            <tr>
              <th>รหัสพนักงาน</th>
              <th>ชื่อ-นามสกุล</th>
              <th>อีเมล</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {employee.length !== 0 ? (
              employee.map((emp) => (
                <tr key={emp.employee_id}>
                  <td>{emp.employee_id}</td>
                  <td>{emp.name}</td>
                  <td>{emp.employee_email}</td>
                  <th>
                    <Link to="insert" className="btn btn-ghost btn-xs">
                      แก้ไข
                    </Link>
                    <button className="btn btn-ghost btn-xs">ลบ</button>
                  </th>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* นำ Pagination component มาใช้งาน */}
      <div className="flex justify-between">
        <select
          value={perPage}
          onChange={(e) => handlePerRowsChange(Number(e.target.value))}
          className="select select-bordered bg-white"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="30">30</option>
          {/* Add more options if needed */}
        </select>
        <div className="flex justify-between items-center">
          <span className="mr-5">
            {`Showing ${(currentPage - 1) * perPage + 1}-${Math.min(
              currentPage * perPage,
              totalRows
            )} of ${totalRows}`}
          </span>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ArrowBigLeft size={20} />
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ArrowBigRight size={20} />
          </button>
        </div>
      </div>
    </>
  );
}

export default Employee;
