import React, { useState } from "react";
import axios from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
function I_expensetype() {
  const [values, setValues] = useState({ expensetype_name: "" });
  const [errors, setErrors] = useState({});

  const validationSchema = Yup.object({
    expensetype_name: Yup.string().required("กรุณากรอกชื่อ ประเภทค่าใช้จ่าย"),
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
      const response = await axios.post("/expensetype/insert", values);
      toast.info(response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hiexpensetyperogressBar: false,
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
        hiexpensetyperogressBar: false,
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
        <h1 className="text-2xl ">เพิ่มประเภทค่าใช้จ่าย</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2  font-medium ">
              ชื่อประเภทค่าใช้จ่าย
            </label>
            <input
              expensetype="text"
              placeholder="กรอกชื่อประเภทค่าใช้จ่าย"
              className="input input-bordered w-full mb-2"
              onChange={(e) => setValues({ expensetype_name: e.target.value })}
            />
            {errors.expensetype_name && (
              <span className="text-error">{errors.expensetype_name}</span>
            )}
            <button expensetype="submit" className="btn btn-primary w-full">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default I_expensetype;
