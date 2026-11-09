// 한국판 / 영어판의 "감성" 차이를 한 곳에 모아둔 설정 파일.
// 문구, 폰트, 글씨 스타일, 그림 프롬프트를 여기서 고치면 사이트 전체에 반영돼요.

export type Locale = "ko" | "en";
export type Placement = "top" | "center" | "bottom";

export type TextStyleId =
  | "yellowOutline" // 노랑 글씨 + 굵은 검정 테두리 (아름답게 늙어가자 카드)
  | "rainbow" // 줄마다 노랑/빨강/초록 (감사하자 기도하자 카드)
  | "white3d" // 흰 입체 글씨 (굿모닝♡ 카드)
  | "redPop" // 빨강 + 흰 테두리
  | "glitter" // 보라 반짝이 필기체 (Good Morning God Bless)
  | "gold" // 금색 필기체 + 검정 테두리 (Have A Nice Day)
  | "chrome"; // 은색 메탈 (Good Morning 큰 글씨)

export interface FontOption {
  id: string;
  label: string;
  family: string; // CSS font-family 이름 (Google Fonts)
  weight: number;
  scale: number; // 폰트마다 크기감이 달라 보정
}

export interface LocaleConfig {
  locale: Locale;
  htmlLang: string;
  title: string;
  subtitle: string;
  placeholder: string;
  presets: { label: string; text: string }[];
  fonts: FontOption[];
  textStyles: { id: TextStyleId; label: string }[];
  defaultStyle: TextStyleId;
  sizes: { id: "portrait" | "square"; label: string }[];
  defaultSize: "portrait" | "square";
  frame: boolean; // 영어판: 반짝이 액자 테두리
  ui: Record<string, string>;
  // 그림 AI에게 전달할 이 판의 분위기
  aesthetic: string;
}

// 모든 그림에 공통으로 붙는 "옛스러운 카톡 카드" 스타일 지시문
export const BASE_IMAGE_STYLE = [
  "A nostalgic, over-the-top digital greeting card BACKGROUND image, in the style of the early-2000s mobile messenger greeting images that grandparents love to share every morning.",
  "Hyper-saturated colors, glossy airbrushed photorealistic flowers, twinkling sparkles and star glints, lens flares, soft glow and bokeh, kitschy layered digital collage, slightly over-sharpened, cheerful and sentimental.",
  "ABSOLUTELY NO text, letters, words, numbers, calligraphy, signatures, watermarks or logos anywhere in the image.",
].join(" ");

const ko: LocaleConfig = {
  locale: "ko",
  htmlLang: "ko",
  title: "효도 카드 만들기",
  subtitle: "인사말만 쓰면, 어울리는 그림을 그려서 예쁜 카드로 만들어 드려요",
  placeholder: "예) 행복한 월요일\n이번주도 매일매일\n행복하시길 바랄게요^^",
  presets: [
    { label: "월요일", text: "한주의 시작! 행복한 월요일\n이번주도 매일매일\n행복하시길 바랄게요^^" },
    { label: "건강", text: "건강이 최고예요\n오늘도 웃으면서\n건강한 하루 되세요~♡" },
    { label: "감사·기도", text: "아름답게 늙어가자!\n늘 감사하자\n늘 기도하자\n항상 기뻐하자" },
    { label: "사랑", text: "마음에 사랑의 씨앗을 뿌리면\n날마다 기쁨의 꽃을 봅니다\n오늘도 서로 사랑하는 날 되세요~^^\n사랑합니다~" },
    { label: "주말", text: "즐거운 주말!\n편안한 휴식으로\n행복 가득한 주말 보내세요~" },
    { label: "비 오는 날", text: "비 오는 날\n따뜻한 차 한잔과 함께\n포근한 하루 되세요" },
    { label: "명절", text: "풍성한 한가위\n가족과 함께\n행복한 명절 보내세요" },
  ],
  fonts: [
    { id: "jua", label: "동글동글", family: "Jua", weight: 400, scale: 1 },
    { id: "gaegu", label: "손글씨", family: "Gaegu", weight: 700, scale: 1.1 },
    { id: "blackhan", label: "굵은 글씨", family: "Black Han Sans", weight: 400, scale: 0.95 },
    { id: "pen", label: "붓펜", family: "Nanum Pen Script", weight: 400, scale: 1.3 },
  ],
  textStyles: [
    { id: "rainbow", label: "알록달록" },
    { id: "yellowOutline", label: "노랑 테두리" },
    { id: "white3d", label: "흰 입체" },
    { id: "redPop", label: "빨강" },
  ],
  defaultStyle: "rainbow",
  sizes: [
    { id: "portrait", label: "세로 (카톡용)" },
    { id: "square", label: "정사각형" },
  ],
  defaultSize: "portrait",
  frame: false,
  ui: {
    step1: "1. 인사말 쓰기",
    step2: "2. 꾸미기",
    quick: "빠른 문구",
    font: "글씨체",
    color: "글씨 색",
    size: "모양",
    make: "그림 그리고 카드 만들기",
    making: "그림 그리는 중… (20초~1분)",
    redraw: "다른 그림으로 다시",
    download: "저장하기",
    share: "카톡으로 보내기",
    shareFallback: "이 기기에서는 바로 보내기가 안 돼서 저장했어요. 카톡에서 사진으로 보내주세요.",
    empty: "인사말을 입력해 주세요",
    hint: "첫 줄은 크게 나와요. 줄바꿈(엔터)으로 줄을 나눠요.",
    preview: "여기에 카드가 나와요",
    demo: "체험 모드: AI 키가 없어 간단한 배경으로 만들었어요",
    code: "입장 코드",
    edit: "글씨는 그림을 다시 그리지 않고 바로 바뀌어요",
    other: "English",
    pos: "글씨 위치",
    posTop: "위",
    posCenter: "가운데",
    posBottom: "아래",
    errCode: "입장 코드가 맞지 않아요",
    errLimit: "오늘 만들 수 있는 횟수를 다 썼어요. 내일 다시 해주세요",
    errBlocked: "이 문구로는 그림을 그릴 수 없어요. 문구를 바꿔주세요",
    errFailed: "그림 그리기에 실패했어요. 잠시 후 다시 눌러주세요",
    errNetwork: "인터넷 연결을 확인해 주세요",
  },
  aesthetic:
    "Korean KakaoTalk 'good morning' card aesthetic: vivid red roses, pink peonies and camellias, fields of yellow tulips, cosmos, cherry blossoms, butterflies, glossy peaches and green apples, sparkling red hearts, bright clear blue sky with sun flare, very colorful, warm and affectionate, a little bit cute.",
};

const en: LocaleConfig = {
  locale: "en",
  htmlLang: "en",
  title: "Blessing Card Maker",
  subtitle: "Type a greeting. We paint a matching old-fashioned picture and turn it into a card to share.",
  placeholder: "e.g. Good Morning\nEnjoy your day\nGod Bless",
  presets: [
    { label: "Good Morning", text: "Good Morning\nEnjoy your day\nGod Bless" },
    { label: "Nice Day", text: "Good Morning\nHave A Nice Day" },
    { label: "Blessed Monday", text: "Happy Monday\nMay God bless your week\nwith peace and joy" },
    { label: "Coffee", text: "Good Morning\nCoffee & blessings\nfor my dear friends" },
    { label: "Good Night", text: "Good Night\nSweet dreams\nGod bless you" },
    { label: "Thinking of You", text: "Thinking of You\nSending love and hugs\ntoday and always" },
    { label: "Sunday", text: "Blessed Sunday\nThe Lord is my shepherd\nHave a peaceful day" },
  ],
  fonts: [
    { id: "vibes", label: "Elegant script", family: "Great Vibes", weight: 400, scale: 1.15 },
    { id: "dancing", label: "Friendly script", family: "Dancing Script", weight: 700, scale: 1 },
    { id: "lobster", label: "Bold retro", family: "Lobster", weight: 400, scale: 0.95 },
    { id: "pinyon", label: "Fancy", family: "Pinyon Script", weight: 400, scale: 1.05 },
  ],
  textStyles: [
    { id: "glitter", label: "Purple glitter" },
    { id: "gold", label: "Gold" },
    { id: "chrome", label: "Silver" },
    { id: "white3d", label: "White glow" },
  ],
  defaultStyle: "glitter",
  sizes: [
    { id: "square", label: "Square" },
    { id: "portrait", label: "Tall" },
  ],
  defaultSize: "square",
  frame: true,
  ui: {
    step1: "1. Write your greeting",
    step2: "2. Decorate",
    quick: "Quick ideas",
    font: "Lettering",
    color: "Text color",
    size: "Shape",
    make: "Paint my card",
    making: "Painting your card… (20–60 sec)",
    redraw: "Paint a different picture",
    download: "Save",
    share: "Share",
    shareFallback: "Sharing isn't supported here, so the card was saved. Send it as a photo.",
    empty: "Please type a greeting",
    hint: "The first line is shown big. Press Enter for a new line.",
    preview: "Your card will appear here",
    demo: "Demo mode: no AI key set, so a simple background was used",
    code: "Access code",
    edit: "Text changes instantly, no need to repaint",
    other: "한국어",
    pos: "Text position",
    posTop: "Top",
    posCenter: "Middle",
    posBottom: "Bottom",
    errCode: "That access code isn't right",
    errLimit: "Daily limit reached. Please try again tomorrow",
    errBlocked: "We can't paint for this text. Please change the wording",
    errFailed: "Painting failed. Please try again in a moment",
    errNetwork: "Please check your internet connection",
  },
  aesthetic:
    "American Facebook 'Good Morning, God Bless' card aesthetic: purple orchids and lilies, lavender sprigs, purple and gold butterflies, a steaming coffee cup with heart latte art, heart-shaped chocolate cookies, deep red roses, white doves in flight, a serene lake with sailboats, glitter dust, heavenly light rays, soft dreamy vignette.",
};

export const LOCALES: Record<Locale, LocaleConfig> = { ko, en };
