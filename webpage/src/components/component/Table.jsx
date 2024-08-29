import React from "react";
import { Link } from "react-router-dom";
import { object } from "yup";

export default function Table({ data, headers, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead className="bg-base-200 text-left">
          <tr className="border-b">
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-3">
                {header}
              </th>
            ))}
            <th className="px-4 py-3">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {data && data.length !== 0 ? (
            data.map((item, index) => {
              const rowData = Object.values(item);
              return (
                <tr key={index} className="border-b">
                  {rowData.map((td, tdIndex) => (
                    <td key={index + tdIndex} className="px-4 py-3">
                      {td}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        to={`edit/${rowData[0]}`}
                        className="btn btn-primary btn-sm"
                      >
                        แก้ไข
                      </Link>
                      <button
                        className="btn btn-error btn-sm"
                        onClick={() =>
                          document
                            .getElementById(`my_modal_${rowData[0]}`)
                            .showModal()
                        }
                      >
                        ลบ
                      </button>
                    </div>
                    <dialog id={`my_modal_${rowData[0]}`} className="modal">
                      <div className="modal-box">
                        <h3 className="font-bold text-lg">ลบข้อมูล</h3>
                        <p className="py-4">
                          ต้องการลบข้อมูล {rowData[0]} หรือไม่
                        </p>
                        <div className="modal-action">
                          <form method="dialog">
                            <button
                              className="btn btn-primary mr-2"
                              onClick={() => onDelete(rowData[0])}
                            >
                              ยืนยัน
                            </button>
                            <button className="btn btn-error">ยกเลิก</button>
                          </form>
                        </div>
                      </div>
                    </dialog>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={headers.length + 1}
                className="text-center px-4 py-3"
              >
                ไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
