import React, { useState } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
function I_unit_m() {
  const axios = useAxiosPrivate();

  const [values, setValues] = useState({ unit_m_name: "" });
  const [errors, setErrors] = useState({});

  const validationSchema = Yup.object({
    unit_m_name: Yup.string()
      .max(45, "ความยาวไม่เกิน 45 ตัวอักษร")
      .required("กรุณากรอกชื่อ หน่วยวัด"),
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
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleInsert = async () => {
    try {
      const response = await axios.post("/unit_m/insert", values);
      toast.info(response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hiunit_mrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

      // Check if the response contains the expected message
    } catch (error) {
      toast.error(error.response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hiunit_mrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">เพิ่มหน่วยวัด</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2  font-medium ">ชื่อหน่วยวัด</label>
            <input
              type="text"
              placeholder="กรอกชื่อหน่วยวัด"
              className="input input-bordered w-full mb-2"
              onChange={(e) => setValues({ unit_m_name: e.target.value })}
            />
            {errors.unit_m_name && (
              <span className="text-error">{errors.unit_m_name}</span>
            )}
            <button type="submit" className="btn btn-primary w-full">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default I_unit_m;
