// test/data/credentials.ts
export interface UserCredential {
  name: string;
  email: string;
  password: string;
}

// 테스트용 계정 목록
export const TEST_USERS: UserCredential[] = [
  // 발롱도르 수상자
  {
    name: 'Lionel Messi',
    email: 'test_messi@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Cristiano Ronaldo',
    email: 'test_ronaldo@example.com', 
    password: 'TestPass123!'
  },
  {
    name: 'Luka Modric',
    email: 'test_modric@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Karim Benzema',
    email: 'test_benzema@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Fabio Cannavaro',
    email: 'test_cannavaro@example.com',
    password: 'TestPass123!'
  },

  // 역대 월드컵 영웅들
  {
    name: 'Pelé',
    email: 'test_pele@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Diego Maradona',
    email: 'test_maradona@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Zinedine Zidane',
    email: 'test_zidane@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Ronaldo Nazário',
    email: 'test_r9@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Miroslav Klose',
    email: 'test_klose@example.com',
    password: 'TestPass123!'
  },

  // 축구 역사의 전설들
  {
    name: 'Johan Cruyff',
    email: 'test_cruyff@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Franz Beckenbauer',
    email: 'test_beckenbauer@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Eusébio',
    email: 'test_eusebio@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Alfredo Di Stéfano',
    email: 'test_distefano@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Michel Platini',
    email: 'test_platini@example.com',
    password: 'TestPass123!'
  },

  // 전설적인 공격수들
  {
    name: 'Ferenc Puskás',
    email: 'test_puskas@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Gerd Müller',
    email: 'test_muller@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Marco van Basten',
    email: 'test_vanbasten@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Romário',
    email: 'test_romario@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Hristo Stoichkov',
    email: 'test_stoichkov@example.com',
    password: 'TestPass123!'
  },

  // 전설적인 미드필더들
  {
    name: 'Bobby Charlton',
    email: 'test_charlton@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Paul Scholes',
    email: 'test_scholes@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Andrea Pirlo',
    email: 'test_pirlo@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Xavi Hernández',
    email: 'test_xavi@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Andrés Iniesta',
    email: 'test_iniesta@example.com',
    password: 'TestPass123!'
  },

  // 전설적인 수비수들
  {
    name: 'Paolo Maldini',
    email: 'test_maldini@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Franco Baresi',
    email: 'test_baresi@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Bobby Moore',
    email: 'test_moore@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Roberto Carlos',
    email: 'test_rcarlos@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Cafu',
    email: 'test_cafu@example.com',
    password: 'TestPass123!'
  },

  // 전설적인 골키퍼들
  {
    name: 'Lev Yashin',
    email: 'test_yashin@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Peter Schmeichel',
    email: 'test_schmeichel@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Oliver Kahn',
    email: 'test_kahn@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Gianluigi Buffon',
    email: 'test_buffon@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Iker Casillas',
    email: 'test_casillas@example.com',
    password: 'TestPass123!'
  },

  // 맨체스터 유나이티드 레전드
  {
    name: 'George Best',
    email: 'test_best@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Eric Cantona',
    email: 'test_cantona@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Wayne Rooney',
    email: 'test_rooney@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Ryan Giggs',
    email: 'test_giggs@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'David Beckham',
    email: 'test_beckham@example.com',
    password: 'TestPass123!'
  },

  // 한국 축구 레전드
  {
    name: 'Cha Bum-kun',
    email: 'test_chabk@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Park Ji-sung',
    email: 'test_parkjs@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Son Heung-min',
    email: 'test_sonhm@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Hong Myung-bo',
    email: 'test_hongmb@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Kim Joo-sung',
    email: 'test_kimjs@example.com',
    password: 'TestPass123!'
  },

  // 현대 축구 스타들
  {
    name: 'Kylian Mbappé',
    email: 'test_mbappe@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Erling Haaland',
    email: 'test_haaland@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Kevin De Bruyne',
    email: 'test_kdb@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Virgil van Dijk',
    email: 'test_vvd@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Mohamed Salah',
    email: 'test_salah@example.com',
    password: 'TestPass123!'
  },

  // 전설적인 감독들
  {
    name: 'Sir Alex Ferguson',
    email: 'test_ferguson@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Johan Cruyff',
    email: 'test_cruyff_coach@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Arrigo Sacchi',
    email: 'test_sacchi@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Rinus Michels',
    email: 'test_michels@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Bill Shankly',
    email: 'test_shankly@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Pep Guardiola',
    email: 'test_guardiola@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'José Mourinho',
    email: 'test_mourinho@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Carlo Ancelotti',
    email: 'test_ancelotti@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Vicente del Bosque',
    email: 'test_delbosque@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Brian Clough',
    email: 'test_clough@example.com',
    password: 'TestPass123!'
  },

  // 추가 전설적 선수들
  {
    name: 'Ronaldinho',
    email: 'test_ronaldinho@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Thierry Henry',
    email: 'test_henry@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Raúl González',
    email: 'test_raul@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Pavel Nedvěd',
    email: 'test_nedved@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Michael Laudrup',
    email: 'test_laudrup@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Kenny Dalglish',
    email: 'test_dalglish@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Steven Gerrard',
    email: 'test_gerrard@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Frank Lampard',
    email: 'test_lampard@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Ruud Gullit',
    email: 'test_gullit@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Alessandro Del Piero',
    email: 'test_delpiero@example.com',
    password: 'TestPass123!'
  }
];

// AI 테스트용 계정
export const AI_TEST_USERS: UserCredential[] = [
  {
    name: 'ChatGPT',
    email: 'gpt_user@example.com',
    password: 'TestPass123!'
  },
  {
    name: 'Claude',
    email: 'claude_user@example.com',
    password: 'TestPass123!'
  }
];