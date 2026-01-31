import FormContainer from "@/components/FormContainer";
import dynamic from "next/dynamic";

const DeleteGroupButton = dynamic(() => import("./DeleteGroupButton"), { ssr: false });
const ExpandToggle = dynamic(() => import("./ExpandToggle"), { ssr: false });

const ResultRow = ({ group, role }: any) => {
  return (
    <>
      {/* Summary row */}
      <tr className="border-b border-gray-200 even:bg-slate-50 text-sm">
        <td className="p-4">
          <div className="flex items-center gap-2">
            <ExpandToggle id={String(group.id)} />
            <span className="font-medium">{group.title}</span>
          </div>
        </td>
        <td>{group.studentName + " " + group.studentSurname}</td>
        <td className="hidden md:table-cell">{group.totalScore}</td>
        <td className="hidden md:table-cell">{group.teacherName ?? ""}</td>
        <td className="hidden md:table-cell">{group.className}</td>
        <td className="hidden md:table-cell">{group.createdAt ? new Intl.DateTimeFormat("en-US").format(new Date(group.createdAt)) : ""}</td>
        <td>
          <div className="flex items-center gap-2">
            <FormContainer table="result" type="update" data={{ id: group.id, studentId: group.studentId, title: group.title, marks: group.children, classId: group.classId, teacherId: group.teacherId }} />
            <DeleteGroupButton ids={group.children.map((c: any) => c.id)} />
          </div>
        </td>
      </tr>

      {/* Detail row with subject containers */}
      <tr id={`details-${group.id}`} className="bg-white hidden">
        <td colSpan={7} className="p-4">
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 p-3 rounded-md shadow-sm">
              {group.children.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between gap-4 text-sm py-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.subject}</div>
                  </div>

                  <div className="w-56 text-center text-sm text-gray-700">
                    <div className="whitespace-nowrap">{c.score} / {c.total} • {Math.round(c.percent)}% • {c.grade}</div>
                  </div>

                  <div className="text-xs text-gray-500 ml-4">{c.createdAt ? new Intl.DateTimeFormat("en-US").format(new Date(c.createdAt)) : ""}</div>
                </div>
              ))}
            </div>

            <div className="text-right text-sm mt-1">Overall: {group.percent}% • {group.grade}</div>
          </div>
        </td>
      </tr>
    </>
  );
};

export default ResultRow;
