import React from "react";

function quotation() {
  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <div className="flex justify-between">
            <div className="form-control">
              <label className="label">
                <span className="label-text">สร้างใบเสนอราคา</span>
              </label>
              <label className="label">
                <span className="label-text">aadsafsfsfsdfsfd</span>
              </label>
            </div>
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">ลูกค้า</span>
                </label>
                <select className="select select-bordered">
                  <option>เลือกลูกค้า หรือกรอกที่อยู่ใหม่</option>
                  {/* Add options for customers here */}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">ข้อมูลลูกค้า</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="รายละเอียดที่อยู่"
                ></textarea>
              </div>

              {/* Add more form fields as needed */}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">จำนวนเงินรวมเสนอ</span>
                </label>
                <input
                  type="text"
                  value="0.00"
                  className="input input-bordered"
                  readOnly
                />
              </div>

              <div className="flex justify-between">
                <div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">วันที่:</span>
                    </label>
                    <input
                      type="text"
                      value="21-03-2024"
                      className="input input-bordered"
                      readOnly
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">เครดิต (วัน):</span>
                    </label>
                    <input
                      type="text"
                      value="0"
                      className="input input-bordered"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">ครบกำหนด:</span>
                    </label>
                    <input
                      type="text"
                      value="21-03-2024"
                      className="input input-bordered"
                      readOnly
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">พนักงานขาย:</span>
                    </label>
                    <input
                      type="text"
                      value="aaa aaa"
                      className="input input-bordered"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Add additional form fields and components as needed */}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">โปรด์ใส่:</span>
                </label>
                <select className="select select-bordered">
                  {/* Add options for promotions here */}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">รายละเอียด:</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="เพิ่มรายละเอียด"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button className="btn btn-outline mr-2">ปิดหน้าต่าง</button>
                <button className="btn btn-primary">บันทึกการซื้อ</button>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">สร้างใบเสนอราคา</span>
                </label>
                <label className="label">
                  <span className="label-text">aadsafsfsfsdfsfd</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">ลูกค้า</span>
                </label>
                <select className="select select-bordered">
                  <option>เลือกลูกค้า หรือกรอกที่อยู่ใหม่</option>
                  {/* Add options for customers here */}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">ข้อมูลลูกค้า</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="รายละเอียดที่อยู่"
                ></textarea>
              </div>

              {/* Add more form fields as needed */}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">จำนวนเงินรวมเสนอ</span>
                </label>
                <input
                  type="text"
                  value="0.00"
                  className="input input-bordered"
                  readOnly
                />
              </div>

              <div className="flex justify-between">
                <div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">วันที่:</span>
                    </label>
                    <input
                      type="text"
                      value="21-03-2024"
                      className="input input-bordered"
                      readOnly
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">เครดิต (วัน):</span>
                    </label>
                    <input
                      type="text"
                      value="0"
                      className="input input-bordered"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">ครบกำหนด:</span>
                    </label>
                    <input
                      type="text"
                      value="21-03-2024"
                      className="input input-bordered"
                      readOnly
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">พนักงานขาย:</span>
                    </label>
                    <input
                      type="text"
                      value="aaa aaa"
                      className="input input-bordered"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Add additional form fields and components as needed */}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">โปรด์ใส่:</span>
                </label>
                <select className="select select-bordered">
                  {/* Add options for promotions here */}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">รายละเอียด:</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="เพิ่มรายละเอียด"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button className="btn btn-outline mr-2">ปิดหน้าต่าง</button>
                <button className="btn btn-primary">บันทึกการซื้อ</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default quotation;
