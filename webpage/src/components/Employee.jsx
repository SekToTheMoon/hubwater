import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "./component/Table";
import SearchInput from "./component/SearchInput";

function Employee() {
  const axios = useAxiosPrivate();
  const [employees, setEmployees] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  let messageSuccess = state && state.msg;
  const headers = ["รหัสพนักงาน", "ชื่อ-นามสกุล", "เบอร์โทร", "อีเมล"];

  const fetchEmployees = async () => {
    try {
      let url = `/employee?page=${currentPage}&per_page=${perPage}`;
      if (search !== "") {
        url += `&search=${search}`;
      }
      const response = await axios.get(url);
      setEmployees(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/employee/delete/" + id);
      fetchEmployees();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (error) {
      // Handle network errors or other issues
      console.error("Error during registration:", error);
      toast.error("Error during registration", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    fetchEmployees();
  };

  useEffect(() => {
    fetchEmployees();
    if (messageSuccess) {
      toast.success(messageSuccess, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  }, [currentPage, perPage]);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">พนักงาน</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              เพิ่มพนักงาน
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>
          {/* <table className="table text-base">
            <thead>
              <tr className="text-base">
                <th>รหัสพนักงาน</th>
                <th>ชื่อ-นามสกุล</th>
                <th>เบอร์โทร</th>
                <th>อีเมล</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {employees.length !== 0 ? (
                employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td>{emp.employee_id}</td>
                    <td>{emp.name}</td>
                    <td>{emp.tel}</td>
                    <td>{emp.employee_email}</td>
                    <td>
                      <Link
                        to={`edit/${emp.employee_id}`}
                        className="btn btn-primary mr-3"
                      >
                        แก้ไข
                      </Link>
                      <button
                        className="btn btn-error"
                        onClick={() =>
                          document
                            .getElementById("my_modal_" + emp.employee_id)
                            .showModal()
                        }
                      >
                        ลบ
                      </button>
                      <dialog
                        id={`my_modal_${emp.employee_id}`}
                        className="modal"
                        key={`modal_${emp.employee_id}`}
                      >
                        <div className="modal-box">
                          <h3 className="font-bold text-lg">ลบข้อมูลพนักงาน</h3>
                          <p className="py-4">
                            ต้องการลบข้อมูลพนักงาน {emp.name} หรือไม่
                          </p>
                          <div className="modal-action">
                            <form method="dialog">
                              <button
                                className="btn btn-primary"
                                onClick={() => handleDelete(emp.employee_id)}
                              >
                                ยืนยัน
                              </button>
                              <button className="btn btn-error">ยกเลิก</button>
                            </form>
                          </div>
                        </div>
                      </dialog>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table> */}
          <Table headers={headers} data={employees} onDelete={handleDelete} />

          <div className="flex justify-between mt-4">
            <select
              value={perPage}
              onChange={(e) => handlePerRowsChange(Number(e.target.value))}
              className="select select-primary"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              {/* Add more options if needed */}
            </select>
            {employees.length !== 0 ? (
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
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default Employee;
