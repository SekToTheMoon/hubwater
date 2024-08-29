import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import statusOptions from "../constants/statusOptions";
import io from "socket.io-client";
import moment from "moment";
import { handleChangeStatus } from "../utils/changeStatus";
import useAuth from "../hooks/useAuth";

function Out() {
  const axios = useAxiosPrivate();
  const { auth } = useAuth();
  //ดึงตำแหน่งมาเพื่อมาเซ็ต option ใน roll
  const roll = auth.posit_name === "หัวหน้า" ? "หัวหน้า" : "ลูกน้อง";

  const [Out, setOut] = useState([]);
  const [Banks, setBanks] = useState([]);
  const [OutMoney, setOutMoney] = useState();
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [outForDel, setOutfordel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const statusOut = statusOptions[5];
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const fetchOuts = async () => {
    let url = `/Out?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setOut(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Outs:", error);
    }
  };

  const fetchBank = async () => {
    let url = `/getbank/all`;
    try {
      const response = await axios.get(url);
      setBanks(response.data);
    } catch (error) {
      console.error("Error fetching bank:", error);
    }
  };

  const handleSelectChange = (event, out) => {
    const selectedValue = event.target.value;
    handleChangeStatus(selectedValue, out.out_id);
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/out/delete/" + id);
      setOutfordel(null);
      fetchOuts();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hiOutrogressBar: false,
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
        hiOutrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchOuts();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  const handleSubmit = async (e) => {
    try {
      const Out_id = OutMoney.out_id;
      await handleOutMoney();
      setOutMoney(null);
      await handleChangeStatus("จ่ายแล้ว", Out_id);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  const handleOutMoney = async () => {
    try {
      const response = await axios.put("/out/money", OutMoney);
      console.log("Completed handleOutMoney", response.data);
      toast.success(response.data, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      console.error("Error during bill insertion:", error);
      toast.error("Error during out insertion", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } finally {
      console.log("handleOutMoney has finished its try-catch block");
    }
  };

  useEffect(() => {
    fetchOuts();
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
      //   messageSuccess = false; ทำไมไม่ทำอย่างนี้
      navigate("/Out");
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("statusUpdate", ({ status, id }) => {
      if (id.startsWith("OT")) {
        setOut((oldOuts) => {
          let newOuts = [...oldOuts];
          const index = newOuts.findIndex((q) => q.out_id === id);
          if (index !== -1) {
            newOuts[index].out_status = status;
          }
          return newOuts;
        });
      }
    });

    return () => {
      console.log("Cleaning up socket");
      socket.disconnect();
    };
  }, []);
  useEffect(() => {
    console.log(OutMoney);
  }, [OutMoney]);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">เอกสารค่าใช้จ่าย</h1>
          <div className="items-center mb-5">
            <div className="flex justify-between items-center mb-5">
              <Link to="insert" className="btn btn-primary">
                เพิ่มใบวางบิล
              </Link>
              <div className="flex">
                {" "}
                <label className="input input-bordered flex items-center gap-2">
                  <input
                    type="text"
                    className="grow bg-base-100"
                    placeholder="ค้นหา"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4 opacity-70"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>
                <button className="btn btn-primary" onClick={handleSearch}>
                  ค้นหา
                </button>
              </div>
            </div>
          </div>

          <table className="table text-base">
            <thead>
              <tr className=" text-base">
                <th>วันที่</th>
                <th>เลขเอกสาร</th>
                <th>ยอดรวมสุทธิ</th>
                <th>พนักงาน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Out && Out.length !== 0 ? (
                Out.map((out, index) => (
                  <tr key={out.out_id}>
                    <td>{out.out_date.substring(0, 10)}</td>
                    <td
                      className="cursor-pointer"
                      onClick={() => navigate(`view/${out.out_id}`)}
                    >
                      {out.out_id}
                    </td>
                    <td>{out.out_total}</td>
                    <td>{out.employee_fname}</td>
                    <td className="flex gap-2">
                      <select
                        value={out.out_status}
                        className="select select-bordered w-1/2 max-w-xs"
                        onChange={(e) => {
                          if (e.target.value === "จ่ายเงิน") {
                            setOutMoney({
                              ...out,
                              out_date: moment(new Date()).format("YYYY-MM-DD"),
                            });
                            fetchBank();
                          } else {
                            handleSelectChange(e, out);
                          }
                        }}
                      >
                        {statusOut[out.out_status][roll].map((element, idx) => (
                          <option key={idx} value={element}>
                            {element}
                          </option>
                        ))}
                      </select>
                      <div className="dropdown dropdown-hover ">
                        <div tabIndex={0} role="button" className="p-2">
                          ...
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box"
                        >
                          <li>
                            <Link to={`edit/${out.out_id}`}>แก้ไข</Link>
                          </li>
                          <li>
                            <button onClick={() => setOutfordel(out)}>
                              ลบ
                            </button>
                          </li>
                        </ul>
                      </div>
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
          </table>
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
            {Out && Out.length !== 0 ? (
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
        {outForDel && (
          <dialog open className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">ลบข้อมูลเอกสารค่าใช้จ่าย</h3>
              <p className="py-4">
                ต้องการลบข้อมูลเอกสารค่าใช้จ่าย {outForDel.out_id} หรือไม่
              </p>
              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleDelete(outForDel.out_id);
                      setOutfordel(null);
                    }}
                  >
                    ยืนยัน
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => setOutfordel(null)}
                  >
                    ยกเลิก
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        )}
        {OutMoney && (
          <dialog open id="my_modal" className="modal">
            <div className="modal-box max-w-sm">
              <h1 className="font-bold text-xl">บันทึกการจ่ายเงิน</h1>
              <div className="grid-cols-2 grid items-center mt-3 gap-y-2">
                <span className="">เลขที่เอกสาร: </span>
                <span className="">{OutMoney.out_id} </span>

                <span className="">ยอดที่ต้องชำระ: </span>
                <span className="">{OutMoney.out_total} </span>

                <span className="">วันที่ชำระ: </span>
                <input
                  className="border rounded-lg border-base-300 focus:bg-tran "
                  type="date"
                  value={OutMoney.out_date}
                  onChange={(e) =>
                    setOutMoney({
                      ...OutMoney,
                      out_date: moment(moment(e.target.value)).format(
                        "YYYY-MM-DD"
                      ),
                    })
                  }
                />

                <h3 className="font-bold text-lg mt-3">วิธีการชำระ</h3>
                <hr />
                <span className="">วิธีการชำระ: </span>
                <select
                  className="border rounded-lg border-base-300 focus:outline-none "
                  value={OutMoney.out_pay || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setOutMoney({ ...OutMoney, out_pay: id });
                  }}
                >
                  <option value="" disabled>
                    เลือกวิธีการชำระ
                  </option>
                  <option value="เงินสด">เงินสด</option>
                  <option value="โอนเงิน">โอนเงิน</option>
                </select>

                {OutMoney.out_pay == "โอนเงิน" ? (
                  <>
                    <span className="">บัญชีจ่ายเงิน: </span>
                    <select
                      className="border rounded-lg border-base-300 focus:outline-none"
                      value={OutMoney.bank_id || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        setOutMoney({ ...OutMoney, bank_id: id });
                      }}
                    >
                      <option value="" disabled>
                        เลือกบัญชี
                      </option>
                      {Banks.map((op) => (
                        <option key={op.bank_id} value={op.bank_id}>
                          {op.bank_name +
                            " " +
                            op.bank_type +
                            " " +
                            op.bank_num}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  ""
                )}
                <h3 className="font-bold text-lg ">รายละเอียด</h3>
                <hr />
                <span className="">หมายเหตุ: </span>
                <textarea
                  className="textarea textarea-bordered"
                  value={OutMoney.out_detail}
                  onChange={(e) => {
                    setOutMoney({
                      ...OutMoney,
                      out_detail: e.target.value,
                    });
                  }}
                ></textarea>
              </div>

              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button, it will close the modal */}
                  <button
                    className="btn"
                    onClick={() => {
                      setOutMoney(null);
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleSubmit();
                    }}
                  >
                    บันทึก
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        )}
      </div>

      <ToastContainer position="top-right" />
    </>
  );
}

export default Out;
