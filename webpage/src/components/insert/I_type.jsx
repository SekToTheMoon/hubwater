import React, { useState } from "react";
import axios from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
function I_type() {
  const [values, setValues] = useState({ type_name: "", type_category: "" });
  const [errors, setErrors] = useState({});

  const validationSchema = Yup.object({
    type_name: Yup.string().required("กรุณากรอกชื่อ ประเภท"),
    type_category: Yup.string().required("กรุณากรอกชื่อ หมวดหมู่"),
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
      const response = await axios.post("/type/insert", values);
      toast.info(response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hityperogressBar: false,
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
        hityperogressBar: false,
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
        <h1 className="text-2xl ">เพิ่มประเภท</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2  font-medium ">ชื่อประเภท</label>
            <input
              type="text"
              placeholder="กรอกชื่อประเภท"
              className="input input-bordered w-full mb-2"
              onChange={(e) =>
                setValues({ ...values, type_name: e.target.value })
              }
            />
            {errors.type_name && (
              <span className="text-error">{errors.type_name}</span>
            )}
            <label className="block mb-2  font-medium ">ชื่อหมวดหมู่</label>
            <input
              type="text"
              placeholder="กรอกชื่อหมวดหมู่"
              className="input input-bordered w-full mb-2"
              onChange={(e) =>
                setValues({ ...values, type_category: e.target.value })
              }
            />
            {errors.type_name && (
              <span className="text-error">{errors.type_category}</span>
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

export default I_type;
