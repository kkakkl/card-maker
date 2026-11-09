import CardMaker from "@/components/CardMaker";

export const metadata = { title: "Blessing Card Maker — Good Morning cards to share" };

export default function Page() {
  return (
    <div lang="en">
      <CardMaker locale="en" />
    </div>
  );
}
