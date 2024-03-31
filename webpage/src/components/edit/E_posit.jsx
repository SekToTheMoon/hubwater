import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
function E_posit() {
  const [values, setValues] = useState({ posit_name: "", dep_id: "" });
  const [errors, setErrors] = useState({});
  const [selectdep, setSelectdep] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    posit_name: Yup.string().required("กรุณากรอกชื่อ ตำแหน่ง"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(values);
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
        .put("http://localhost:3001/position/edit/" + id, values)
        .then((res) =>
          navigate("/all/position", { state: { msg: res.data.msg } })
        );
    } catch (error) {
      toast.error(error.response.data.msg, {
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
  };
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
    axios
      .get("http://localhost:3001/getposit/" + id)
      .then((res) =>
        setValues({
          posit_name: res.data[0].posit_name,
          dep_id: res.data[0].dep_id,
        })
      )
      .catch((err) => console.log(err));
    console.log(values);
  }, []);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">แก้ไขตำแหน่ง</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <div>
                <label className="block mb-2  font-medium ">แผนก</label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.dep_id}
                  onChange={(e) =>
                    setValues({ ...values, dep_id: e.target.value })
                  }
                >
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
              <div>
                <label className="block mb-2  font-medium ">ชื่อตำแหน่ง</label>
                <input
                  type="text"
                  placeholder="กรอกชื่อตำแหน่ง"
                  value={values.posit_name}
                  className="input input-bordered w-full mb-2"
                  onChange={(e) =>
                    setValues({ ...values, posit_name: e.target.value })
                  }
                />
                {errors.posit_name && (
                  <span className="text-error">{errors.posit_name}</span>
                )}
              </div>
            </div>
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

export default E_posit;
