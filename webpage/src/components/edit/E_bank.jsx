import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
function E_bank() {
  const axios = useAxiosPrivate();
  const bank_type = ["ออมทรัพย์", "ฝากประจำ", "กระแสรายวัน"];
  const bank_list = [
    "ธ.กสิกรไทย",
    "ธ.ไทยพาณิชย์",
    "ธ.กรุงเทพ",
    "ธ.กรุงไทย",
    "ธ.ทหารไทย",
    "ธ.กรุงศรีอยุธยา",
    "ธ.ออมสิน",
    "ธ.ธนชาต",
    "ธ.ซีไอเอ็มบี ไทย",
    "ธ.ยูโอบี",
    "ธ.ทิสโก้",
    "ธ.ซิตี้แบงก์",
    "ธ.แลนด์ แอนด์ เฮ้าส์",
    "ธ.เกียรตินาคิน",
    "ธ.เพื่อการเกษตรและสหกรณ์การเกษตร",
    "ธ.เพื่อการส่งออกและนำเข้าแห่งประเทศไทย",
    "ธ.สแตนดาร์ดชาร์เตอร์ด",
    "ธ.อาคารสงเคราะห์",
    "ธ.พัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย",
    "ธ.อิสลามแห่งประเทศไทย",
    "ธ.แห่งประเทศจีน (ไทย)",
    "ธ.ไอซีบีซี (ไทย)",
    "ธ.เมกะ สากลพาณิชย์",
    "ธ.ซูมิโตโม มิตซุย แบงกิ้ง คอร์ปอเรชั่น",
    "ธ.มิซูโฮ จำกัด (กรุงเทพฯ)",
    "ธ.ฮ่องกงและเซี่ยงไฮ้แบงกิ้งคอร์ปอเรชั่น",
    "ธ.ไทยเครดิต เพื่อรายย่อย",
    "ธ.ดอยซ์แบงก์",
    "ธ.อินเดียนโอเวอร์ซีส์",
    "ธ.แห่งอเมริกา",
    "ธ.ทหารไทยธนชาต",
  ];
  const [values, setValues] = useState({
    bank_name: "",
    bank_branch: "",
    bank_owner: "",
    bank_type: "",
    bank_num: "",
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    bank_name: Yup.string().required("กรุณากรอกชื่อ ยี่ห้อ"),
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
        .put("/bank/edit/" + id, values)
        .then((res) => navigate("/bank", { state: { msg: res.data.msg } }));
    } catch (error) {
      toast.error(error.response.data.msg, {
        position: "top-right",
        autoClose: 3000,
        hibankrogressBar: false,
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
      .get("/getbank/" + id)
      .then((res) =>
        setValues({
          bank_name: res.data[0].bank_name,
          bank_branch: res.data[0].bank_branch,
          bank_type: res.data[0].bank_type,
          bank_owner: res.data[0].bank_owner,
          bank_num: res.data[0].bank_num,
        })
      )
      .catch((err) => console.log(err));
  }, []);
  return (
    <>
      <div className="rounded-box bg-base-100 p-8">
        <h1 className="text-2xl ">แก้ไขยี่ห้อ</h1>
        <hr className="my-4" />
        <div className="flex items-center w-75">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 ">
              <div className="w-2/12">
                <label htmlFor="dep_id" className="block mb-2 font-medium">
                  ธนาคาร
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.bank_name}
                  onChange={(e) =>
                    setValues({ ...values, bank_name: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {bank_list.map((op, index) => (
                    <option key={index} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                {errors.bank_name && (
                  <span className="text-error">{errors.bank_name}</span>
                )}
              </div>
              <div className="w-5/12">
                <label htmlFor="bank_branch" className="block mb-2 font-medium">
                  สาขา
                </label>
                <input
                  type="text"
                  value={values.bank_branch}
                  placeholder="สาขาของบัญชีธนาคาร"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) =>
                    setValues({ ...values, bank_branch: e.target.value })
                  }
                />
                {errors.bank_branch && (
                  <span className="text-error">{errors.bank_branch}</span>
                )}
              </div>
              <div className="w-5/12">
                <label htmlFor="bank_num" className="block mb-2 font-medium">
                  เลขบัญชี
                </label>
                <input
                  type="text"
                  value={values.bank_num}
                  placeholder="เลขบัญชีธนาคาร"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) =>
                    setValues({ ...values, bank_num: e.target.value })
                  }
                />
                {errors.bank_num && (
                  <span className="text-error">{errors.bank_num}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 ">
              <div className="w-2/12">
                <label htmlFor="bank_type" className="block mb-2 font-medium">
                  ประเภทบัญชี
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.bank_type}
                  onChange={(e) =>
                    setValues({ ...values, bank_type: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {bank_type.map((op, index) => (
                    <option key={index} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                {errors.bank_type && (
                  <span className="text-error">{errors.bank_type}</span>
                )}
              </div>
              <div className="w-10/12">
                <label htmlFor="bank_owner" className="block mb-2 font-medium">
                  ชื่อเจ้าของบัญชี
                </label>
                <input
                  type="text"
                  value={values.bank_owner}
                  placeholder="ชื่อ-นามสกุล"
                  className="input input-bordered w-full mb-1"
                  onChange={(e) =>
                    setValues({ ...values, bank_owner: e.target.value })
                  }
                />
                {errors.bank_owner && (
                  <span className="text-error">{errors.bank_owner}</span>
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

export default E_bank;
