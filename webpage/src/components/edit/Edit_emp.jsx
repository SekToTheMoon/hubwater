import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import moment from "moment";

function Edit_emp() {
  const [values, setValues] = useState({
    fname: "",
    lname: "",
    bdate: new Date(),
    sex: "",
    salary: "",
    hiredate: new Date(),
    username: "",
    password: "",
    nid: "",
    address: "",
    email: "",
    line: "",
    commit: "",
    position: "",
    province: "",
    confirmation: "",
    phone: [""],
    dep: "",
    subdistrict: "",
    zip_code: "",
  });

  const [errors, setErrors] = useState({});
  const [selectprovince, setSelectProvince] = useState([]);
  const [selectdistrict, setSelectDistrict] = useState([]);
  const [selectsubdistrict, setSelectSubdistrict] = useState([]);
  const [selectdep, setSelectdep] = useState([]);
  const [selectposit, setSelectposit] = useState([]);
  const [images, setImage] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const validationSchema = Yup.object({
    fname: Yup.string().required("กรุณากรอกชื่อ"),
    lname: Yup.string().required("กรุณากรอกนามสกุล"),
    // เพิ่ม validationSchema ต่อไปตามต้องการ
  });

  //จัดการไฟล์รูปภาพ
  const handleFileChange = (e) => {
    if (e.target.files.length === 1) {
      setImage([e.target.files[0]]);
    } else {
      console.log("เลือกรูปได้เพียง 1 รูป");
    }
  };

  const handleChangePhone = (e, i) => {
    const inputdata = [...values.phone];
    inputdata[i] = e.target.value;
    setValues({ ...values, phone: inputdata });
  };

  const handleDelete = (i) => {
    const deletVal = [...values.phone];
    axios
      .delete(`http://localhost:3001/employeephone/delete/${id}/${deletVal[i]}`)
      .then((response) => {
        console.log(response.data);
        deletVal.splice(i, 1);
        setValues({ ...values, phone: deletVal });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const fetchProvince = async () => {
    await axios
      .get("http://localhost:3001/getprovince")
      .then((res) => {
        setSelectProvince(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchDistrict = async (province) => {
    await axios
      .get(`http://localhost:3001/getdistrict/${province}`)
      .then((res) => {
        setSelectDistrict(res.data);
      })
      .catch((err) => console.log(err));
  };

  const fetchSubdistrict = async (district) => {
    await axios
      .get(`http://localhost:3001/getsubdistrict/${district}`)
      .then((res) => {
        setSelectSubdistrict(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchDep = async () => {
    await axios
      .get("http://localhost:3001/getdep/all")
      .then((res) => {
        setSelectdep(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchPosit = async (dep) => {
    await axios
      .get(`http://localhost:3001/getempselectposit/${dep}`)
      .then((res) => {
        setSelectposit(res.data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    axios
      .get(`http://localhost:3001/getemployee/${id}`)
      .then((res) => {
        const employeeData = res.data.data[0];
        const bdate = moment(employeeData.employee_bdate).format("YYYY-MM-DD");
        const hiredate = moment(employeeData.employee_hiredate).format(
          "YYYY-MM-DD"
        );
        setValues({
          fname: employeeData.employee_fname,
          lname: employeeData.employee_lname,
          sex: employeeData.employee_sex,
          bdate: bdate,
          address: employeeData.employee_address,
          subdistrict: employeeData.subdistrict_code,
          email: employeeData.employee_email || "",
          type: employeeData.employee_type,
          nid: employeeData.employee_nid || "",
          facebook: employeeData.employee_fb || "",
          line: employeeData.employee_line || "",
          salary: employeeData.employee_salary || "",
          hiredate: hiredate,
          username: employeeData.employee_username || "",
          commit: employeeData.employee_commit || "",
          position: employeeData.posit_id || "",
          phone: employeeData.phone ? employeeData.phone.split(",") : [""], // แก้ไขตรงนี้
          province: employeeData.province || "",
          district: employeeData.district || "",
          zip_code: res.data.zip_code[0].zip_code || "",
          dep: employeeData.dep_id,
        });
        setImageURL(
          `http://localhost:3001/img/avatar/${employeeData.employee_img}`
        );
        console.log(values);
      })
      .catch((err) => console.log(err));
    fetchProvince();
    fetchDep();
  }, []);

  useEffect(() => {
    if (values.dep) {
      fetchPosit(values.dep);
    }
  }, [values.dep]);

  useEffect(() => {
    if (values.province) {
      fetchDistrict(values.province);
    }
  }, [values.province]);

  useEffect(() => {
    if (values.district) {
      fetchSubdistrict(values.district);
    }
  }, [values.district]);

  useEffect(() => {
    if (images.length !== 1) return;

    const newImageURL = URL.createObjectURL(images[0]);
    setImageURL(newImageURL);
    console.log(images);

    return () => {
      // Cleanup เมื่อ Component ถูก unmount
      URL.revokeObjectURL(newImageURL);
    };
  }, [images]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await validationSchema.validate(values, { abortEarly: false });
      handleEdit();
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

  const handleEdit = async () => {
    const formData = new FormData();
    formData.append("position", values.position);
    formData.append("hiredate", values.hiredate);
    formData.append("fname", values.fname);
    formData.append("lname", values.lname);
    formData.append("sex", values.sex);
    formData.append("bdate", values.bdate);
    formData.append("nid", values.nid);
    formData.append("address", values.address);
    formData.append("salary", values.salary);
    formData.append("commit", values.commit);
    formData.append("email", values.email);
    formData.append("line", values.line);
    formData.append("username", values.username);
    formData.append("password", values.password);
    formData.append("img", images[0]);
    formData.append("subdistrict", values.subdistrict);
    values.phone.forEach((phone) => {
      formData.append("phone", phone);
    });
    try {
      const response = await axios.put(
        `http://localhost:3001/employee/edit/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
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
      navigate("/all/employee");
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

  return (
    <>
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">แก้ไขข้อมูลพนักงาน</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          <form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto 2xl:max-w-7xl"
          >
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5 ">
                <label
                  htmlFor="dep"
                  className="block mb-2 text-sm font-medium  "
                >
                  แผนก
                </label>
                <select
                  className="select select-bordered w-full"
                  value={values.dep}
                  onChange={(e) => {
                    const selectedDep = e.target.value;
                    setValues({ ...values, dep: selectedDep, position: "" });
                    fetchPosit(selectedDep);
                  }}
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
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="position"
                  className="block mb-2 text-sm font-medium  "
                >
                  ตำแหน่ง
                </label>
                <select
                  className="select select-bordered w-full"
                  name="position"
                  value={values.position}
                  onChange={(e) => {
                    setValues({ ...values, position: e.target.value });
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectposit.map((op) => (
                    <option key={op.posit_id} value={op.posit_id}>
                      {op.posit_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="hiredate"
                  className="block mb-2 text-sm font-medium  "
                >
                  วันเริ่มทำงาน
                </label>
                <input
                  type="date"
                  value={values.hiredate}
                  onChange={(e) => {
                    setValues({ ...values, hiredate: e.target.value }); // ใช้ e.target.value แทน e.target.Date
                  }}
                  dateformat="yyyy-MM-dd"
                  className="input input-bordered w-full mb-1"
                />
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="fname"
                  className="block mb-2 text-sm font-medium  "
                >
                  ชื่อ
                </label>
                <input
                  type="text"
                  name="fname"
                  value={values.fname}
                  onChange={(e) =>
                    setValues({ ...values, fname: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="ชื่อจริง"
                />
              </div>
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="lname"
                  className="block mb-2 text-sm font-medium "
                >
                  นามสกุล
                </label>
                <input
                  type="text"
                  name="lname"
                  value={values.lname}
                  onChange={(e) =>
                    setValues({ ...values, lname: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="นามสกุลจริง"
                />
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-none mb-5 2xl:w-1/6">
                <label
                  htmlFor="sex"
                  className="block mb-2 text-sm font-medium  "
                >
                  เพศ
                </label>
                <select
                  className="select select-bordered w-full"
                  name="sex"
                  value={values.sex}
                  onChange={(e) =>
                    setValues({ ...values, sex: e.target.value })
                  }
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="bdate"
                  className="block mb-2 text-sm font-medium  "
                >
                  วัน/เดือน/ปี เกิด
                </label>
                <input
                  type="date"
                  value={values.bdate}
                  onChange={(e) => {
                    setValues({ ...values, bdate: e.target.value });
                  }}
                  dateformat="yyyy-MM-dd"
                  className="input input-bordered w-full mb-1"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="nid"
                  className="block mb-2 text-sm font-medium  "
                >
                  เลขประจำตัวประชาชน
                </label>
                <input
                  type="text"
                  name="nid"
                  value={values.nid}
                  onChange={(e) =>
                    setValues({ ...values, nid: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="รหัส 12 หลัก"
                />
              </div>
            </div>
            <div className="mb-5">
              <label
                htmlFor="address"
                className="block mb-2 text-sm font-medium  "
              >
                ที่อยู่ปัจจุบัน
              </label>
              <input
                type="text"
                name="address"
                value={values.address}
                onChange={(e) =>
                  setValues({ ...values, address: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
              />
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label htmlFor="จังหวัด" className="block mb-2  font-medium">
                  จังหวัด
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.province}
                  onChange={(e) => {
                    const selectedProvince = e.target.value;
                    setValues({
                      ...values,
                      province: selectedProvince,
                      district: "",
                      subdistrict: "",
                      zip_code: "",
                    });
                    fetchDistrict(selectedProvince);
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectprovince.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.province && (
                  <span className="text-error">{errors.province}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="district" className="block mb-2  font-medium">
                  อำเภอ
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.district}
                  onChange={(e) => {
                    const selectedDistrict = e.target.value;
                    setValues({
                      ...values,
                      district: selectedDistrict,
                      subdistrict: "",
                      zip_code: "",
                    });
                    fetchSubdistrict(selectedDistrict);
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectdistrict.map((op) => (
                    <option key={op.code} value={op.code}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.district && (
                  <span className="text-error">{errors.district}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="subdistrict"
                  className="block mb-2  font-medium"
                >
                  ตำบล
                </label>
                <select
                  className="select select-bordered w-full max-w-xs mb-1"
                  value={values.subdistrict}
                  onChange={(e) => {
                    console.log(e.target.value.split(",")[1]);
                    setValues({
                      ...values,
                      subdistrict: e.target.value.split(",")[0],
                      zip_code: e.target.value.split(",")[1],
                    });
                  }}
                >
                  <option value="" disabled>
                    เลือก
                  </option>
                  {selectsubdistrict.map((op) => (
                    <option key={op.code} value={[op.code, op.zip_code]}>
                      {op.name}
                    </option>
                  ))}
                </select>

                {errors.subdistrict && (
                  <span className="text-error">{errors.subdistrict}</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="username" className="block mb-2  font-medium">
                  รหัสไปรษณีย์
                </label>
                <input
                  type="text"
                  name="zip_code"
                  className="input input-bordered w-full mb-1"
                  readOnly
                  value={values.zip_code}
                />
                {errors.zip_code && (
                  <span className="text-error">{errors.zip_code}</span>
                )}
              </div>
            </div>

            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="salary"
                  className="block mb-2 text-sm font-medium  "
                >
                  เงินเดือน
                </label>
                <input
                  type="text"
                  name="salary"
                  value={values.salary}
                  onChange={(e) =>
                    setValues({ ...values, salary: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="เงินเดือน"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="fname"
                  className="block mb-2 text-sm font-medium  "
                >
                  ค่าคอมมิชชั่น
                </label>
                <input
                  type="text"
                  name="commit"
                  value={values.commit}
                  onChange={(e) =>
                    setValues({ ...values, commit: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="เปอร์เซ็นต์"
                />
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className="flex-1 mb-5">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium  "
                >
                  อีเมล
                </label>
                <input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={(e) =>
                    setValues({ ...values, email: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="ชืออีเมล@gemail.com"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="line"
                  className="block mb-2 text-sm font-medium  "
                >
                  ID LINE
                </label>
                <input
                  type="text"
                  name="line"
                  value={values.line}
                  onChange={(e) =>
                    setValues({ ...values, line: e.target.value })
                  }
                  className="input input-bordered w-full"
                />
              </div>
            </div>
            <div className="mt-5 2xl:flex gap-x-5">
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="img"
                  className="block mb-2 text-sm font-medium  "
                >
                  รูป
                </label>
                <input
                  type="file"
                  name="img"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input file-input-bordered w-full"
                />
                {imageURL && (
                  <div className="w-100 flex justify-center h-40 bg-base-200">
                    <img className="w-100" src={imageURL} alt="uploaded" />
                  </div>
                )}
              </div>
              <div className="flex-1 mb-5">
                <label htmlFor="phone" className="block mb-2  font-medium">
                  เบอร์โทร
                </label>
                <div className="flex">
                  <div className="w-full">
                    {values.phone.map((data, i) => {
                      return (
                        <div key={`phone[${i}]`} className="w-full">
                          <div className="flex">
                            <input
                              type="text"
                              name={`phone[${i}]`}
                              value={data}
                              onChange={(e) => handleChangePhone(e, i)}
                              className=" input input-bordered w-full mb-1"
                            />
                            {i == 0 && (
                              <div
                                className="btn btn-primary w-16"
                                onClick={() => {
                                  setValues(() => ({
                                    ...values,
                                    phone: [...values.phone, ""],
                                  }));
                                }}
                              >
                                เพิ่ม
                              </div>
                            )}
                            {i !== 0 && (
                              <div
                                className="mx-auto btn btn-accent  w-16"
                                onClick={() => handleDelete(i)}
                              >
                                ลบ
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <hr />
            <div className="mt-5 2xl:flex gap-x-5">
              <div className=" flex-1 mb-5">
                <label
                  htmlFor="username"
                  className="block mb-2 text-sm font-medium  "
                >
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  name="username"
                  value={values.username}
                  onChange={(e) =>
                    setValues({ ...values, username: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Username"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium  "
                >
                  Your password
                </label>
                <input
                  type="password"
                  name="password"
                  onChange={(e) =>
                    setValues({ ...values, password: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Password"
                />
              </div>
              <div className="flex-1 mb-5">
                <label
                  htmlFor="confirm password"
                  className="block mb-2 text-sm font-medium  "
                >
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmation"
                  onChange={(e) =>
                    setValues({ ...values, confirmation: e.target.value })
                  }
                  className="input input-bordered w-full"
                  placeholder="Confirm Password"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full mb-5">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default Edit_emp;
