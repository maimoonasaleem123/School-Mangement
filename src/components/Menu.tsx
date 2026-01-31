import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["admin"],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/lesson.png",
        label: "Assign Teacher",
        href: "/list/lessons",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/list/results",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/attendance.png",
        label: "Attendance",
        href: "/list/attendance",
        visible: ["admin", "teacher"],
      },
     
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },

];

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  return (
    <nav className="mt-4 text-sm w-56">
      {menuItems.map((group) => (
        <div className="flex flex-col gap-3" key={group.title}>
          <span className="hidden lg:block text-gray-400 font-medium my-2 text-xs tracking-wide">
            {group.title}
          </span>
          {group.items.map((item) => {
            if (!item.visible.includes(role)) return null;
            return (
              <Link
                href={item.href}
                key={item.label}
                className="group flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                <span className="w-10 h-10 flex items-center justify-center rounded-md bg-white ring-1 ring-gray-100 group-hover:bg-primary-50">
                  <Image src={item.icon} alt="" width={18} height={18} />
                </span>
                <span className="hidden lg:block font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default Menu;
