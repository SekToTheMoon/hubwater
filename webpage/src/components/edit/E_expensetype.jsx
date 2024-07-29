import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
function E_expensetype() {
  const [values, setValues] = useState({ expensetype_name: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    expensetype_name: Yup.string().required("กรุณากรอกชื่อ ประเภทค่าใช้จ่าย"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleEdit();
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error.inner.forEach((err) => {
        newErrors[err.path] = err.message;
      });

      setErrors(newErrors);
    }
  };
  const handleEdit = async () => {
    try {
      await axios
        .put("/expensetype/edit/" + id, values)
        .then((res) =>
          navigate("/all/expensetype", { state: { msg: res.data.msg } })
        );
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

  useEffect(() => {
    axios
      .get("/getexpensetype/" + id)
      .then((res) =>
        setValues({ expensetype_name: res.data[0].expensetype_name })
      )
      .catch((err) => console.log(err));
  }, []);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">แก้ไขประเภทค่าใช้จ่าย</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2  font-medium ">
              ชื่อประเภทค่าใช้จ่าย
            </label>
            <input
              type="text"
              placeholder="กรอกชื่อประเภทค่าใช้จ่าย"
              value={values.expensetype_name}
              className="input input-bordered w-full mb-2"
              onChange={(e) => setValues({ expensetype_name: e.target.value })}
            />
            {errors.expensetype_name && (
              <span className="text-error">{errors.expensetype_name}</span>
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

export default E_expensetype;
