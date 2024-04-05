import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
function I_posit() {
  const [values, setValues] = useState({ posit_name: "", dep_id: "" });
  const [errors, setErrors] = useState({});
  const [selectdep, setSelectdep] = useState([]);

  const validationSchema = Yup.object({
    posit_name: Yup.string().required("กรุณากรอกชื่อ แผนก"),
    dep_id: Yup.string().required("กรุณาเลือกแผนกด้วย"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleInsert();
      setErrors({});
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error.inner.forEach((err) => {
        console.log(err.path);
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleInsert = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/position/insert",
        values
      );
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
    } catch (error) {
      toast.error(error.response.data.msg, {
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
  //เอาแผนกท้ังหมด
  const fetchDep = async () => {
    await axios
      .get("http://localhost:3001/getdep/all")
      .then((res) => {
        setSelectdep(res.data);
        console.log(selectdep);
      })
      .catch((err) => console.log(err));
  };
  useEffect(() => {
    fetchDep();
  }, []);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">เพิ่มตำแหน่ง</h1>
        <hr className="my-4" />
        <div className="flex items-center w-75">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            <div className="flex gap-2 ">
              {" "}
              <div className="w-2/12">
                <label className="block mb-2  font-medium ">แผนก</label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.dep_id}
                  onChange={(e) =>
                    setValues({ ...values, dep_id: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectdep.map((op) => (
                    <option key={op.dep_id} value={op.dep_id}>
                      {op.dep_name}
                    </option>
                  ))}
                </select>
                {errors.dep_id && (
                  <span className="text-error">{errors.dep_id}</span>
                )}
              </div>
              <div className="w-10/12">
                <label className="block mb-2  font-medium ">ชื่อตำแหน่ง</label>
                <input
                  type="text"
                  placeholder=""
                  name="posit_name"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) => {
                    setValues({ ...values, posit_name: e.target.value });
                  }}
                />
                {errors.posit_name && (
                  <span className="text-error">{errors.posit_name}</span>
                )}
              </div>
            </div>
            <span>สิทธิ์การเข้าใช้งาน</span>
            <hr />
            <div className="form-control max-w-64">
              <label className="label cursor-pointer">
                <span className="label-text">เลือกทั้งหมด</span>
                <input type="checkbox" className="checkbox" />
              </label>
            </div>
            <hr />
            <div className="grid grid-cols-5 gap-x-32">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text ">Dashbord</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
              <div className="form-control ">
                <label className="label cursor-pointer">
                  <span className="label-text ">พนักงานขาย</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
              <div className="form-control ">
                <label className="label cursor-pointer">
                  <span className="label-text ">ลูกค้า</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
              <div className="form-control ">
                <label className="label cursor-pointer">
                  <span className="label-text ">เอกสารขาย</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
              <div className="form-control ">
                <label className="label cursor-pointer">
                  <span className="label-text">สินค้า</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
              <div className="form-control ">
                <label className="label cursor-pointer">
                  <span className="label-text">ค่าคงที่สินค้า</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
              <div className="form-control ">
                <label className="label cursor-pointer">
                  <span className="label-text">ขายหน้าร้าน</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
              <div className="form-control ">
                <label className="label cursor-pointer">
                  <span className="label-text">แผนก</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
              <div className="form-control ">
                <label className="label cursor-pointer">
                  <span className="label-text">บัญชีธนาคาร</span>
                  <input type="checkbox" className="checkbox" />
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mt-2">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default I_posit;
