import React from "react";
import { Link } from "react-router-dom";

function MobileDocTable({
  data,
  onDelete,
  statusList,
  handleSelectChange,
  roll,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
      {data.map((item, index) => {
        const rowData = Object.values(item);
        return (
          <div
            key={index}
            className="space-y-3 p-4 items-start rounded-lg shadow"
          >
            <div className="flex justify-between ">
              {/* เรียกใช้ htmlTemplate โดยส่ง rowData เป็นพารามิเตอร์ */}
              <div>
                <div className="w-full">
                  <Link
                    to={`view/${rowData[0]}?version=${rowData[7]}`}
                    className="text-secondary font-bold hover:underline"
                  >
                    {rowData[0]}
                  </Link>

                  <div className="text-sm p-1">
                    <div>ลูกค้า : {rowData[3]}</div>

                    <div className="break-words">{rowData[5]}</div>
                  </div>
                </div>
                <select
                  value={rowData[6]}
                  className="select select-sm select-bordered   max-w-xs"
                  onChange={(e) => handleSelectChange(e, item)}
                >
                  {statusList[rowData[6]][roll].map((element, idx) => (
                    <option key={idx} value={element}>
                      {element}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dropdown dropdown-hover dropdown-end ml-auto">
                <div tabIndex={0} role="button">
                  <i class="fa-solid fa-ellipsis"></i>
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box"
                >
                  <li
                    className={
                      rowData[6] === "ดำเนินการแล้ว" ||
                      rowData[6] === "เก็บเงินแล้ว" ||
                      rowData[0].startsWith("RC")
                        ? "hidden"
                        : ""
                    }
                  >
                    <Link
                      to={
                        rowData[0].startsWith("QT")
                          ? `edit/${rowData[0]}?version=${item.quotation_num}`
                          : `edit/${rowData[0]}`
                      }
                      className="btn btn-warning text-warning-content btn-sm opacity-80"
                    >
                      แก้ไข
                    </Link>
                  </li>
                  <li>
                    <button
                      className="btn btn-error btn-sm text-error-content opacity-80"
                      onClick={() => onDelete(rowData[0])}
                    >
                      ลบ
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MobileDocTable;
