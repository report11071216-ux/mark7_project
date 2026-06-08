// 레이드 도감 프리셋 — 등록 화면에서 골라 자동 입력
// 새 레이드가 나오면 이 배열에 항목만 추가하면 됨

export type RaidPreset = {
  title: string;
  imageUrl: string;
  goldNormal: number;
  goldHard: number;
  goldNightmare: number;
};

export const RAID_PRESETS: RaidPreset[] = [
  {
    title: "구원의 종탑",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1779957650986-9q345e.jpg",
    goldNormal: 30000,
    goldHard: 40000,
    goldNightmare: 50000,
  },
  {
    title: "고통의 마녀 세르카",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1779957606631-se4fww.jpg",
    goldNormal: 35000,
    goldHard: 44000,
    goldNightmare: 54000,
  },
  {
    title: "종막:최후의 날",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1779768354281-xostct.webp",
    goldNormal: 20000,
    goldHard: 40000,
    goldNightmare: 0,
  },
  {
    title: "4막 : 파멸의 성채",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1780205600047-y0u6zl.jpg",
    goldNormal: 33000,
    goldHard: 42000,
    goldNightmare: 0,
  },
  {
    title: "3막 : 칠흑 폭풍의 밤",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1780205557069-6ztokv.jpg",
    goldNormal: 21000,
    goldHard: 27000,
    goldNightmare: 0,
  },
  {
    title: "2막 : 부유하는 악몽의 진혼곡",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1780205246922-86daen.jpg",
    goldNormal: 16500,
    goldHard: 23000,
    goldNightmare: 0,
  },
  {
    title: "1막 : 대지를 부수는 업화의 궤적",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1780204869099-6r5ban.jpg",
    goldNormal: 11500,
    goldHard: 18000,
    goldNightmare: 0,
  },
  {
    title: "서막 : 붉어진 백야의 나선",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1780205664084-zib0ht.jpg",
    goldNormal: 6100,
    goldHard: 7200,
    goldNightmare: 0,
  },
  {
    title: "베히모스",
    imageUrl: "https://prdcdrgxbtryrjjoasuc.supabase.co/storage/v1/object/public/raid-images/1780205697568-uu2qvf.jpg",
    goldNormal: 7200,
    goldHard: 0,
    goldNightmare: 0,
  },
];
