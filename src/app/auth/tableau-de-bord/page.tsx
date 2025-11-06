import Journal from "@/components/Journal";
import BabyTimePad from "@/components/BabyTimePad";

export default function DashboardPage() {
  return (
    <main
      className="
        flex flex-col items-center justify-start
        w-full min-h-screen bg-gray-50
        px-2 sm:px-8 pt-4 sm:pt-8
      "
    >
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Bienvenue sur votre tableau de bord 👶
      </h1>

      {/* Section pad de suivi rapide */}
      <section className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto mb-8">
        <BabyTimePad />
      </section>

      {/* Section journal */}
      <section className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto">
        <Journal />
      </section>
    </main>
  );
}
