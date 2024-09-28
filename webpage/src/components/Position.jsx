import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "./component/Table";
import SearchInput from "./component/SearchInput";

function Position() {
  const axios = useAxiosPrivate();
  const [position, setPosition] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const headers = ["รหัสตำแหน่ง", "ชื่อตำแหน่ง", "แผนก"];
  const fetchpositions = async () => {
    let url = `/position?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setPosition(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/position/delete/" + id);
      fetchpositions();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hipositrogressBar: false,
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
        autoClose: 5000,
        hipositrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchpositions();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchpositions();
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
      navigate("/position");
    }
  }, [currentPage, perPage]);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ตำแหน่ง</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              เพิ่มตำแหน่ง
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>
          {/* <table className="table text-base">
            <thead>
              <tr className=" text-base">
                <th>รหัสตำแหน่ง</th>
                <th>ชื่อตำแหน่ง</th>
                <th>แผนก</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {position && position.length !== 0 ? (
                position.map((posit) => (
                  <tr key={posit.posit_id}>
                    <td>{posit.posit_id}</td>
                    <td>{posit.posit_name}</td>
                    <td>{posit.dep_name}</td>
                    <td>
                      <Link
                        to={`edit/${posit.posit_id}`}
                        className="btn btn-primary mr-3"
                      >
                        แก้ไข
                      </Link>
                      <button
                        className="btn btn-error"
                        onClick={() =>
                          document
                            .getElementById("my_modal_" + posit.posit_id)
                            .showModal()
                        }
                      >
                        ลบ
                      </button>
                      <dialog
                        id={`my_modal_${posit.posit_id}`}
                        className="modal"
                      >
                        <div className="modal-box">
                          <h3 className="font-bold text-lg">ลบข้อมูลตำแหน่ง</h3>
                          <p className="py-4">
                            ต้องการลบข้อมูลตำแหน่ง {posit.posit_name} หรือไม่
                          </p>
                          <div className="modal-action">
                            <form method="dialog">
                              <button
                                className="btn btn-primary"
                                onClick={() => handleDelete(posit.posit_id)}
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
                  <td colSpan="5" className="text-center">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table> */}
          <Table headers={headers} data={position} onDelete={handleDelete} />

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
            {position && position.length !== 0 ? (
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

export default Position;
