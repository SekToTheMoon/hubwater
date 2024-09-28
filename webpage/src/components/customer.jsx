import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Table from "./component/Table";
import SearchInput from "./component/SearchInput";

function Customer() {
  const axios = useAxiosPrivate();
  const [Customer, setCustomer] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  let messageSuccess = state && state.msg;
  const headers = ["รหัสลูกค้า", "ชื่อลูกค้า", "เบอร์โทร", "อีเมล", "ประเภท"];

  const fetchCustomers = async () => {
    try {
      let url = `/customer?page=${currentPage}&per_page=${perPage}`;
      if (search != "") {
        url += `&search=${search}`;
      }
      const response = await axios.get(url);
      setCustomer(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Customers:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/Customer/delete/" + id);
      fetchCustomers();
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

  const handleSearch = () => {
    fetchCustomers();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchCustomers();
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
        <div className="rounded-box bg-base-100 px-12 py-8 ">
          <h1 className="text-2xl mb-5">ลูกค้า</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              เพิ่มลูกค้า
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>
          {/* <table className="table text-base">
            <thead>
              <tr className=" text-base">
                <th>รหัสลูกค้า</th>
                <th>ชื่อลูกค้า</th>
                <th>เบอร์โทร</th>
                <th>อีเมล</th>
                <th>ประเภท</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Customer && Customer.length !== 0 ? (
                Customer.map((ctm) => (
                  <tr key={ctm.customer_id}>
                    <td>{ctm.customer_id}</td>
                    <td>{ctm.customer_name}</td>
                    <td>{ctm.tel}</td>
                    <td>{ctm.customer_email}</td>
                    <td>{ctm.customer_type}</td>
                    <td>
                      <Link
                        to={`edit/${ctm.customer_id}`}
                        className="btn btn-primary mr-3"
                      >
                        แก้ไข
                      </Link>
                      <button
                        className="btn btn-error"
                        onClick={() =>
                          document
                            .getElementById("my_modal_" + ctm.customer_id)
                            .showModal()
                        }
                      >
                        ลบ
                      </button>
                      <dialog
                        id={`my_modal_${ctm.customer_id}`}
                        className="modal"
                        key={`modal_${ctm.customer_id}`}
                      >
                        <div className="modal-box">
                          <h3 className="font-bold text-lg">ลบข้อมูลลูกค้า</h3>
                          <p className="py-4">
                            ต้องการลบข้อมูลลูกค้า {ctm.Customer_name} หรือไม่
                          </p>
                          <div className="modal-action">
                            <form method="dialog">
                              <button
                                className="btn btn-primary"
                                onClick={() => handleDelete(ctm.customer_id)}
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
          <Table headers={headers} data={Customer} onDelete={handleDelete} />

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
            {Customer && Customer.length !== 0 ? (
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

export default Customer;
