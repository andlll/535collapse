// Generato da tools/08_anim.py dal blocco "Assegnazione sprite" dello
// Step di ogni unita' (src/objects/<unita'>/Step.gml): non modificare a mano.
// Ogni funzione imposta i.sprite_index da action, phase e step, con la
// stessa cascata di if dell'originale (l'ultima assegnazione vera vince).
// w: il mondo (per "girati verso il bersaglio", vedi tools/08_anim.py).

export const ANIM = {
  ally_warrior(i, w) {
    if (i.action < 2) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "ww41";
        }
        if (i.step === 1) {
          i.sprite_index = "ww42";
        }
        if (i.step === 2) {
          i.sprite_index = "ww41";
        }
        if (i.step === 3) {
          i.sprite_index = "ww43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "ww51";
        }
        if (i.step === 1) {
          i.sprite_index = "ww52";
        }
        if (i.step === 2) {
          i.sprite_index = "ww51";
        }
        if (i.step === 3) {
          i.sprite_index = "ww53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "ww61";
        }
        if (i.step === 1) {
          i.sprite_index = "ww62";
        }
        if (i.step === 2) {
          i.sprite_index = "ww61";
        }
        if (i.step === 3) {
          i.sprite_index = "ww63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "ww71";
        }
        if (i.step === 1) {
          i.sprite_index = "ww72";
        }
        if (i.step === 2) {
          i.sprite_index = "ww71";
        }
        if (i.step === 3) {
          i.sprite_index = "ww73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "ww81";
        }
        if (i.step === 1) {
          i.sprite_index = "ww82";
        }
        if (i.step === 2) {
          i.sprite_index = "ww81";
        }
        if (i.step === 3) {
          i.sprite_index = "ww83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "ww11";
        }
        if (i.step === 1) {
          i.sprite_index = "ww12";
        }
        if (i.step === 2) {
          i.sprite_index = "ww11";
        }
        if (i.step === 3) {
          i.sprite_index = "ww13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "ww21";
        }
        if (i.step === 1) {
          i.sprite_index = "ww22";
        }
        if (i.step === 2) {
          i.sprite_index = "ww21";
        }
        if (i.step === 3) {
          i.sprite_index = "ww23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "ww31";
        }
        if (i.step === 1) {
          i.sprite_index = "ww32";
        }
        if (i.step === 2) {
          i.sprite_index = "ww31";
        }
        if (i.step === 3) {
          i.sprite_index = "ww33";
        }
      }
    }
    if (i.action === 2 && w.exists("enemy_unit")) w.faceAhead(i, "enemy_unit");
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "wa41";
          }
          if (i.step === 1) {
            i.sprite_index = "wa42";
          }
          if (i.step === 2) {
            i.sprite_index = "wa43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "wa51";
          }
          if (i.step === 1) {
            i.sprite_index = "wa52";
          }
          if (i.step === 2) {
            i.sprite_index = "wa53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "wa61";
          }
          if (i.step === 1) {
            i.sprite_index = "wa62";
          }
          if (i.step === 2) {
            i.sprite_index = "wa63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "wa71";
          }
          if (i.step === 1) {
            i.sprite_index = "wa72";
          }
          if (i.step === 2) {
            i.sprite_index = "wa73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "wa81";
          }
          if (i.step === 1) {
            i.sprite_index = "wa82";
          }
          if (i.step === 2) {
            i.sprite_index = "wa83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "wa11";
          }
          if (i.step === 1) {
            i.sprite_index = "wa12";
          }
          if (i.step === 2) {
            i.sprite_index = "wa13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "wa21";
          }
          if (i.step === 1) {
            i.sprite_index = "wa22";
          }
          if (i.step === 2) {
            i.sprite_index = "wa23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "wa31";
          }
          if (i.step === 1) {
            i.sprite_index = "wa32";
          }
          if (i.step === 2) {
            i.sprite_index = "wa33";
          }
        }
      }
    }
    if (i.action === 6) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "ff41";
        }
        if (i.step === 1) {
          i.sprite_index = "ff42";
        }
        if (i.step === 2) {
          i.sprite_index = "ff43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "ff51";
        }
        if (i.step === 1) {
          i.sprite_index = "ff52";
        }
        if (i.step === 2) {
          i.sprite_index = "ff53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "ff61";
        }
        if (i.step === 1) {
          i.sprite_index = "ff62";
        }
        if (i.step === 2) {
          i.sprite_index = "ff63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "ff71";
        }
        if (i.step === 1) {
          i.sprite_index = "ff72";
        }
        if (i.step === 2) {
          i.sprite_index = "ff73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "ff81";
        }
        if (i.step === 1) {
          i.sprite_index = "ff82";
        }
        if (i.step === 2) {
          i.sprite_index = "ff83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "ff11";
        }
        if (i.step === 1) {
          i.sprite_index = "ff12";
        }
        if (i.step === 2) {
          i.sprite_index = "ff13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "ff21";
        }
        if (i.step === 1) {
          i.sprite_index = "ff22";
        }
        if (i.step === 2) {
          i.sprite_index = "ff23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "ff31";
        }
        if (i.step === 1) {
          i.sprite_index = "ff32";
        }
        if (i.step === 2) {
          i.sprite_index = "ff33";
        }
      }
    }
  },
  ally_picchiere(i, w) {
    if (i.action < 2) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "pw41";
        }
        if (i.step === 1) {
          i.sprite_index = "pw42";
        }
        if (i.step === 2) {
          i.sprite_index = "pw41";
        }
        if (i.step === 3) {
          i.sprite_index = "pw43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "pw51";
        }
        if (i.step === 1) {
          i.sprite_index = "pw52";
        }
        if (i.step === 2) {
          i.sprite_index = "pw51";
        }
        if (i.step === 3) {
          i.sprite_index = "pw53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "pw61";
        }
        if (i.step === 1) {
          i.sprite_index = "pw62";
        }
        if (i.step === 2) {
          i.sprite_index = "pw61";
        }
        if (i.step === 3) {
          i.sprite_index = "pw63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "pw71";
        }
        if (i.step === 1) {
          i.sprite_index = "pw72";
        }
        if (i.step === 2) {
          i.sprite_index = "pw71";
        }
        if (i.step === 3) {
          i.sprite_index = "pw73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "pw81";
        }
        if (i.step === 1) {
          i.sprite_index = "pw82";
        }
        if (i.step === 2) {
          i.sprite_index = "pw81";
        }
        if (i.step === 3) {
          i.sprite_index = "pw83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "pw11";
        }
        if (i.step === 1) {
          i.sprite_index = "pw12";
        }
        if (i.step === 2) {
          i.sprite_index = "pw11";
        }
        if (i.step === 3) {
          i.sprite_index = "pw13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "pw21";
        }
        if (i.step === 1) {
          i.sprite_index = "pw22";
        }
        if (i.step === 2) {
          i.sprite_index = "pw21";
        }
        if (i.step === 3) {
          i.sprite_index = "pw23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "pw31";
        }
        if (i.step === 1) {
          i.sprite_index = "pw32";
        }
        if (i.step === 2) {
          i.sprite_index = "pw31";
        }
        if (i.step === 3) {
          i.sprite_index = "pw33";
        }
      }
    }
    if (i.action === 2 && w.exists("enemy_unit")) w.faceAhead(i, "enemy_unit");
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "pa41";
          }
          if (i.step === 1) {
            i.sprite_index = "pa42";
          }
          if (i.step === 2) {
            i.sprite_index = "pa43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "pa51";
          }
          if (i.step === 1) {
            i.sprite_index = "pa52";
          }
          if (i.step === 2) {
            i.sprite_index = "pa53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "pa61";
          }
          if (i.step === 1) {
            i.sprite_index = "pa62";
          }
          if (i.step === 2) {
            i.sprite_index = "pa63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "pa71";
          }
          if (i.step === 1) {
            i.sprite_index = "pa72";
          }
          if (i.step === 2) {
            i.sprite_index = "pa73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "pa81";
          }
          if (i.step === 1) {
            i.sprite_index = "pa82";
          }
          if (i.step === 2) {
            i.sprite_index = "pa83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "pa11";
          }
          if (i.step === 1) {
            i.sprite_index = "pa12";
          }
          if (i.step === 2) {
            i.sprite_index = "pa13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "pa21";
          }
          if (i.step === 1) {
            i.sprite_index = "pa22";
          }
          if (i.step === 2) {
            i.sprite_index = "pa23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "pa31";
          }
          if (i.step === 1) {
            i.sprite_index = "pa32";
          }
          if (i.step === 2) {
            i.sprite_index = "pa33";
          }
        }
      }
    }
    if (i.action === 6) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "ff41";
        }
        if (i.step === 1) {
          i.sprite_index = "ff42";
        }
        if (i.step === 2) {
          i.sprite_index = "ff43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "ff51";
        }
        if (i.step === 1) {
          i.sprite_index = "ff52";
        }
        if (i.step === 2) {
          i.sprite_index = "ff53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "ff61";
        }
        if (i.step === 1) {
          i.sprite_index = "ff62";
        }
        if (i.step === 2) {
          i.sprite_index = "ff63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "ff71";
        }
        if (i.step === 1) {
          i.sprite_index = "ff72";
        }
        if (i.step === 2) {
          i.sprite_index = "ff73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "ff81";
        }
        if (i.step === 1) {
          i.sprite_index = "ff82";
        }
        if (i.step === 2) {
          i.sprite_index = "ff83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "ff11";
        }
        if (i.step === 1) {
          i.sprite_index = "ff12";
        }
        if (i.step === 2) {
          i.sprite_index = "ff13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "ff21";
        }
        if (i.step === 1) {
          i.sprite_index = "ff22";
        }
        if (i.step === 2) {
          i.sprite_index = "ff23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "ff31";
        }
        if (i.step === 1) {
          i.sprite_index = "ff32";
        }
        if (i.step === 2) {
          i.sprite_index = "ff33";
        }
      }
    }
  },
  ally_arciere(i, w) {
    if (i.action < 2) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "aw41";
        }
        if (i.step === 1) {
          i.sprite_index = "aw42";
        }
        if (i.step === 2) {
          i.sprite_index = "aw41";
        }
        if (i.step === 3) {
          i.sprite_index = "aw43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "aw51";
        }
        if (i.step === 1) {
          i.sprite_index = "aw52";
        }
        if (i.step === 2) {
          i.sprite_index = "aw51";
        }
        if (i.step === 3) {
          i.sprite_index = "aw53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "aw61";
        }
        if (i.step === 1) {
          i.sprite_index = "aw62";
        }
        if (i.step === 2) {
          i.sprite_index = "aw61";
        }
        if (i.step === 3) {
          i.sprite_index = "aw63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "aw71";
        }
        if (i.step === 1) {
          i.sprite_index = "aw72";
        }
        if (i.step === 2) {
          i.sprite_index = "aw71";
        }
        if (i.step === 3) {
          i.sprite_index = "aw73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "aw81";
        }
        if (i.step === 1) {
          i.sprite_index = "aw82";
        }
        if (i.step === 2) {
          i.sprite_index = "aw81";
        }
        if (i.step === 3) {
          i.sprite_index = "aw83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "aw11";
        }
        if (i.step === 1) {
          i.sprite_index = "aw12";
        }
        if (i.step === 2) {
          i.sprite_index = "aw11";
        }
        if (i.step === 3) {
          i.sprite_index = "aw13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "aw21";
        }
        if (i.step === 1) {
          i.sprite_index = "aw22";
        }
        if (i.step === 2) {
          i.sprite_index = "aw21";
        }
        if (i.step === 3) {
          i.sprite_index = "aw23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "aw31";
        }
        if (i.step === 1) {
          i.sprite_index = "aw32";
        }
        if (i.step === 2) {
          i.sprite_index = "aw31";
        }
        if (i.step === 3) {
          i.sprite_index = "aw33";
        }
      }
    }
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "aa41";
          }
          if (i.step === 1) {
            i.sprite_index = "aa42";
          }
          if (i.step === 2) {
            i.sprite_index = "aa43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "aa51";
          }
          if (i.step === 1) {
            i.sprite_index = "aa52";
          }
          if (i.step === 2) {
            i.sprite_index = "aa53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "aa61";
          }
          if (i.step === 1) {
            i.sprite_index = "aa62";
          }
          if (i.step === 2) {
            i.sprite_index = "aa63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "aa71";
          }
          if (i.step === 1) {
            i.sprite_index = "aa72";
          }
          if (i.step === 2) {
            i.sprite_index = "aa73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "aa81";
          }
          if (i.step === 1) {
            i.sprite_index = "aa82";
          }
          if (i.step === 2) {
            i.sprite_index = "aa83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "aa11";
          }
          if (i.step === 1) {
            i.sprite_index = "aa12";
          }
          if (i.step === 2) {
            i.sprite_index = "aa13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "aa21";
          }
          if (i.step === 1) {
            i.sprite_index = "aa22";
          }
          if (i.step === 2) {
            i.sprite_index = "aa23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "aa31";
          }
          if (i.step === 1) {
            i.sprite_index = "aa32";
          }
          if (i.step === 2) {
            i.sprite_index = "aa33";
          }
        }
      }
    }
  },
  ally_cavaliere(i, w) {
    if (i.action < 2) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "cm41";
        }
        if (i.step === 1) {
          i.sprite_index = "cm42";
        }
        if (i.step === 2) {
          i.sprite_index = "cm41";
        }
        if (i.step === 3) {
          i.sprite_index = "cm43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "cm51";
        }
        if (i.step === 1) {
          i.sprite_index = "cm52";
        }
        if (i.step === 2) {
          i.sprite_index = "cm51";
        }
        if (i.step === 3) {
          i.sprite_index = "cm53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "cm61";
        }
        if (i.step === 1) {
          i.sprite_index = "cm62";
        }
        if (i.step === 2) {
          i.sprite_index = "cm61";
        }
        if (i.step === 3) {
          i.sprite_index = "cm63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "cm71";
        }
        if (i.step === 1) {
          i.sprite_index = "cm72";
        }
        if (i.step === 2) {
          i.sprite_index = "cm71";
        }
        if (i.step === 3) {
          i.sprite_index = "cm73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "cm81";
        }
        if (i.step === 1) {
          i.sprite_index = "cm82";
        }
        if (i.step === 2) {
          i.sprite_index = "cm81";
        }
        if (i.step === 3) {
          i.sprite_index = "cm83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "cm11";
        }
        if (i.step === 1) {
          i.sprite_index = "cm12";
        }
        if (i.step === 2) {
          i.sprite_index = "cm11";
        }
        if (i.step === 3) {
          i.sprite_index = "cm13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "cm21";
        }
        if (i.step === 1) {
          i.sprite_index = "cm22";
        }
        if (i.step === 2) {
          i.sprite_index = "cm21";
        }
        if (i.step === 3) {
          i.sprite_index = "cm23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "cm31";
        }
        if (i.step === 1) {
          i.sprite_index = "cm32";
        }
        if (i.step === 2) {
          i.sprite_index = "cm31";
        }
        if (i.step === 3) {
          i.sprite_index = "cm33";
        }
      }
    }
    if (i.action === 2 && w.exists("enemy_unit")) w.faceAhead(i, "enemy_unit");
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "ca41";
          }
          if (i.step === 1) {
            i.sprite_index = "ca42";
          }
          if (i.step === 2) {
            i.sprite_index = "ca43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "ca51";
          }
          if (i.step === 1) {
            i.sprite_index = "ca52";
          }
          if (i.step === 2) {
            i.sprite_index = "ca53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "ca61";
          }
          if (i.step === 1) {
            i.sprite_index = "ca62";
          }
          if (i.step === 2) {
            i.sprite_index = "ca63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "ca71";
          }
          if (i.step === 1) {
            i.sprite_index = "ca72";
          }
          if (i.step === 2) {
            i.sprite_index = "ca73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "ca81";
          }
          if (i.step === 1) {
            i.sprite_index = "ca82";
          }
          if (i.step === 2) {
            i.sprite_index = "ca83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "ca11";
          }
          if (i.step === 1) {
            i.sprite_index = "ca12";
          }
          if (i.step === 2) {
            i.sprite_index = "ca13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "ca21";
          }
          if (i.step === 1) {
            i.sprite_index = "ca22";
          }
          if (i.step === 2) {
            i.sprite_index = "ca23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "ca31";
          }
          if (i.step === 1) {
            i.sprite_index = "ca32";
          }
          if (i.step === 2) {
            i.sprite_index = "ca33";
          }
        }
      }
    }
  },
  ally_omino(i, w) {
    if (i.action < 2) {
      if (i.wood <= 0 || i.gold <= 0 || i.food <= 0 || i.stone <= 0) {
        if (i.phase === 1) {
          if (i.step === 0) {
            if (i.sprite_index !== "ow41") {
              i.sprite_index = "ow41";
            }
          }
          if (i.step === 1) {
            if (i.sprite_index !== "ow42") {
              i.sprite_index = "ow42";
            }
          }
          if (i.step === 2) {
            if (i.sprite_index !== "ow41") {
              i.sprite_index = "ow41";
            }
          }
          if (i.step === 3) {
            if (i.sprite_index !== "ow43") {
              i.sprite_index = "ow43";
            }
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            if (i.sprite_index !== "ow51") {
              i.sprite_index = "ow51";
            }
          }
          if (i.step === 1) {
            if (i.sprite_index !== "ow52") {
              i.sprite_index = "ow52";
            }
          }
          if (i.step === 2) {
            if (i.sprite_index !== "ow51") {
              i.sprite_index = "ow51";
            }
          }
          if (i.step === 3) {
            if (i.sprite_index !== "ow53") {
              i.sprite_index = "ow53";
            }
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            if (i.sprite_index !== "ow61") {
              i.sprite_index = "ow61";
            }
          }
          if (i.step === 1) {
            if (i.sprite_index !== "ow62") {
              i.sprite_index = "ow62";
            }
          }
          if (i.step === 2) {
            if (i.sprite_index !== "ow61") {
              i.sprite_index = "ow61";
            }
          }
          if (i.step === 3) {
            if (i.sprite_index !== "ow63") {
              i.sprite_index = "ow63";
            }
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            if (i.sprite_index !== "ow71") {
              i.sprite_index = "ow71";
            }
          }
          if (i.step === 1) {
            if (i.sprite_index !== "ow72") {
              i.sprite_index = "ow72";
            }
          }
          if (i.step === 2) {
            if (i.sprite_index !== "ow71") {
              i.sprite_index = "ow71";
            }
          }
          if (i.step === 3) {
            if (i.sprite_index !== "ow73") {
              i.sprite_index = "ow73";
            }
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            if (i.sprite_index !== "ow81") {
              i.sprite_index = "ow81";
            }
          }
          if (i.step === 1) {
            if (i.sprite_index !== "ow82") {
              i.sprite_index = "ow82";
            }
          }
          if (i.step === 2) {
            if (i.sprite_index !== "ow81") {
              i.sprite_index = "ow81";
            }
          }
          if (i.step === 3) {
            if (i.sprite_index !== "ow83") {
              i.sprite_index = "ow83";
            }
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            if (i.sprite_index !== "ow11") {
              i.sprite_index = "ow11";
            }
          }
          if (i.step === 1) {
            if (i.sprite_index !== "ow12") {
              i.sprite_index = "ow12";
            }
          }
          if (i.step === 2) {
            if (i.sprite_index !== "ow11") {
              i.sprite_index = "ow11";
            }
          }
          if (i.step === 3) {
            if (i.sprite_index !== "ow13") {
              i.sprite_index = "ow13";
            }
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            if (i.sprite_index !== "ow21") {
              i.sprite_index = "ow21";
            }
          }
          if (i.step === 1) {
            if (i.sprite_index !== "ow22") {
              i.sprite_index = "ow22";
            }
          }
          if (i.step === 2) {
            if (i.sprite_index !== "ow21") {
              i.sprite_index = "ow21";
            }
          }
          if (i.step === 3) {
            if (i.sprite_index !== "ow23") {
              i.sprite_index = "ow23";
            }
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            if (i.sprite_index !== "ow31") {
              i.sprite_index = "ow31";
            }
          }
          if (i.step === 1) {
            if (i.sprite_index !== "ow32") {
              i.sprite_index = "ow32";
            }
          }
          if (i.step === 2) {
            if (i.sprite_index !== "ow31") {
              i.sprite_index = "ow31";
            }
          }
          if (i.step === 3) {
            if (i.sprite_index !== "ow33") {
              i.sprite_index = "ow33";
            }
          }
        }
      }
    }
    if (i.wood > 0 || i.gold > 0 || i.food > 0 || i.stone > 0) {
      if (i.phase === 1) {
        if (i.step === 0) {
          if (i.sprite_index !== "car41") {
            i.sprite_index = "car41";
          }
        }
        if (i.step === 1) {
          if (i.sprite_index !== "car42") {
            i.sprite_index = "car42";
          }
        }
        if (i.step === 2) {
          if (i.sprite_index !== "car41") {
            i.sprite_index = "car41";
          }
        }
        if (i.step === 3) {
          if (i.sprite_index !== "car43") {
            i.sprite_index = "car43";
          }
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "car51";
        }
        if (i.step === 1) {
          i.sprite_index = "car52";
        }
        if (i.step === 2) {
          i.sprite_index = "car51";
        }
        if (i.step === 3) {
          i.sprite_index = "car53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "car61";
        }
        if (i.step === 1) {
          i.sprite_index = "car62";
        }
        if (i.step === 2) {
          i.sprite_index = "car61";
        }
        if (i.step === 3) {
          i.sprite_index = "car63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "car71";
        }
        if (i.step === 1) {
          i.sprite_index = "car72";
        }
        if (i.step === 2) {
          i.sprite_index = "car71";
        }
        if (i.step === 3) {
          i.sprite_index = "car73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "car81";
        }
        if (i.step === 1) {
          i.sprite_index = "car82";
        }
        if (i.step === 2) {
          i.sprite_index = "car81";
        }
        if (i.step === 3) {
          i.sprite_index = "car83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "car11";
        }
        if (i.step === 1) {
          i.sprite_index = "car12";
        }
        if (i.step === 2) {
          i.sprite_index = "car11";
        }
        if (i.step === 3) {
          i.sprite_index = "car13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "car21";
        }
        if (i.step === 1) {
          i.sprite_index = "car22";
        }
        if (i.step === 2) {
          i.sprite_index = "car21";
        }
        if (i.step === 3) {
          i.sprite_index = "car23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "car31";
        }
        if (i.step === 1) {
          i.sprite_index = "car32";
        }
        if (i.step === 2) {
          i.sprite_index = "car31";
        }
        if (i.step === 3) {
          i.sprite_index = "car33";
        }
      }
    }
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "owo41";
          }
          if (i.step === 1) {
            i.sprite_index = "owo42";
          }
          if (i.step === 2) {
            i.sprite_index = "owo43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "owo51";
          }
          if (i.step === 1) {
            i.sprite_index = "owo52";
          }
          if (i.step === 2) {
            i.sprite_index = "owo53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "owo61";
          }
          if (i.step === 1) {
            i.sprite_index = "owo62";
          }
          if (i.step === 2) {
            i.sprite_index = "owo63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "owo71";
          }
          if (i.step === 1) {
            i.sprite_index = "owo72";
          }
          if (i.step === 2) {
            i.sprite_index = "owo73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "owo81";
          }
          if (i.step === 1) {
            i.sprite_index = "owo82";
          }
          if (i.step === 2) {
            i.sprite_index = "owo83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "owo11";
          }
          if (i.step === 1) {
            i.sprite_index = "owo12";
          }
          if (i.step === 2) {
            i.sprite_index = "owo13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "owo21";
          }
          if (i.step === 1) {
            i.sprite_index = "owo22";
          }
          if (i.step === 2) {
            i.sprite_index = "owo23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "owo31";
          }
          if (i.step === 1) {
            i.sprite_index = "owo32";
          }
          if (i.step === 2) {
            i.sprite_index = "owo33";
          }
        }
      }
    }
    if (i.action === 6 || i.action === 7) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "ob41";
        }
        if (i.step === 1) {
          i.sprite_index = "ob42";
        }
        if (i.step === 2) {
          i.sprite_index = "ob43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "ob51";
        }
        if (i.step === 1) {
          i.sprite_index = "ob52";
        }
        if (i.step === 2) {
          i.sprite_index = "ob53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "ob61";
        }
        if (i.step === 1) {
          i.sprite_index = "ob62";
        }
        if (i.step === 2) {
          i.sprite_index = "ob63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "ob71";
        }
        if (i.step === 1) {
          i.sprite_index = "ob72";
        }
        if (i.step === 2) {
          i.sprite_index = "ob73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "ob81";
        }
        if (i.step === 1) {
          i.sprite_index = "ob82";
        }
        if (i.step === 2) {
          i.sprite_index = "ob83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "ob11";
        }
        if (i.step === 1) {
          i.sprite_index = "ob12";
        }
        if (i.step === 2) {
          i.sprite_index = "ob13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "ob21";
        }
        if (i.step === 1) {
          i.sprite_index = "ob22";
        }
        if (i.step === 2) {
          i.sprite_index = "ob23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "ob31";
        }
        if (i.step === 1) {
          i.sprite_index = "ob32";
        }
        if (i.step === 2) {
          i.sprite_index = "ob33";
        }
      }
    }
    if (i.action === 8) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "os41";
        }
        if (i.step === 1) {
          i.sprite_index = "os42";
        }
        if (i.step === 2) {
          i.sprite_index = "os43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "os51";
        }
        if (i.step === 1) {
          i.sprite_index = "os52";
        }
        if (i.step === 2) {
          i.sprite_index = "os53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "os61";
        }
        if (i.step === 1) {
          i.sprite_index = "os62";
        }
        if (i.step === 2) {
          i.sprite_index = "os63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "os71";
        }
        if (i.step === 1) {
          i.sprite_index = "os72";
        }
        if (i.step === 2) {
          i.sprite_index = "os73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "os81";
        }
        if (i.step === 1) {
          i.sprite_index = "os82";
        }
        if (i.step === 2) {
          i.sprite_index = "os83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "os11";
        }
        if (i.step === 1) {
          i.sprite_index = "os12";
        }
        if (i.step === 2) {
          i.sprite_index = "os13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "os21";
        }
        if (i.step === 1) {
          i.sprite_index = "os22";
        }
        if (i.step === 2) {
          i.sprite_index = "os23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "os31";
        }
        if (i.step === 1) {
          i.sprite_index = "os32";
        }
        if (i.step === 2) {
          i.sprite_index = "os33";
        }
      }
    }
  },
  ally_catapulta(i, w) {
    if (i.action === 0) {
      if (i.phase === 1) {
        i.sprite_index = "cati41";
      }
      if (i.phase === 2) {
        i.sprite_index = "cati51";
      }
      if (i.phase === 3) {
        i.sprite_index = "cati61";
      }
      if (i.phase === 4) {
        i.sprite_index = "cati71";
      }
      if (i.phase === 5) {
        i.sprite_index = "cati81";
      }
      if (i.phase === 6) {
        i.sprite_index = "cati11";
      }
      if (i.phase === 7) {
        i.sprite_index = "cati21";
      }
      if (i.phase === 8) {
        i.sprite_index = "cati31";
      }
    }
    if (i.action === 1) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "catm41";
        }
        if (i.step === 1) {
          i.sprite_index = "catm42";
        }
        if (i.step === 2) {
          i.sprite_index = "catm41";
        }
        if (i.step === 3) {
          i.sprite_index = "catm43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "catm51";
        }
        if (i.step === 1) {
          i.sprite_index = "catm52";
        }
        if (i.step === 2) {
          i.sprite_index = "catm51";
        }
        if (i.step === 3) {
          i.sprite_index = "catm53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "catm61";
        }
        if (i.step === 1) {
          i.sprite_index = "catm62";
        }
        if (i.step === 2) {
          i.sprite_index = "catm61";
        }
        if (i.step === 3) {
          i.sprite_index = "catm63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "catm71";
        }
        if (i.step === 1) {
          i.sprite_index = "catm72";
        }
        if (i.step === 2) {
          i.sprite_index = "catm71";
        }
        if (i.step === 3) {
          i.sprite_index = "catm73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "catm81";
        }
        if (i.step === 1) {
          i.sprite_index = "catm82";
        }
        if (i.step === 2) {
          i.sprite_index = "catm81";
        }
        if (i.step === 3) {
          i.sprite_index = "catm83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "catm11";
        }
        if (i.step === 1) {
          i.sprite_index = "catm12";
        }
        if (i.step === 2) {
          i.sprite_index = "catm11";
        }
        if (i.step === 3) {
          i.sprite_index = "catm13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "catm21";
        }
        if (i.step === 1) {
          i.sprite_index = "catm22";
        }
        if (i.step === 2) {
          i.sprite_index = "catm21";
        }
        if (i.step === 3) {
          i.sprite_index = "catm23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "catm31";
        }
        if (i.step === 1) {
          i.sprite_index = "catm32";
        }
        if (i.step === 2) {
          i.sprite_index = "catm31";
        }
        if (i.step === 3) {
          i.sprite_index = "catm33";
        }
      }
    }
    if (i.action === 2) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "cati41";
        }
        if (i.step === 1) {
          i.sprite_index = "cati42";
        }
        if (i.step === 2) {
          i.sprite_index = "cati43";
        }
        if (i.step === 3) {
          i.sprite_index = "cati44";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "cati51";
        }
        if (i.step === 1) {
          i.sprite_index = "cati52";
        }
        if (i.step === 2) {
          i.sprite_index = "cati53";
        }
        if (i.step === 3) {
          i.sprite_index = "cati54";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "cati61";
        }
        if (i.step === 1) {
          i.sprite_index = "cati62";
        }
        if (i.step === 2) {
          i.sprite_index = "cati63";
        }
        if (i.step === 3) {
          i.sprite_index = "cati64";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "cati71";
        }
        if (i.step === 1) {
          i.sprite_index = "cati72";
        }
        if (i.step === 2) {
          i.sprite_index = "cati73";
        }
        if (i.step === 3) {
          i.sprite_index = "cati74";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "cati81";
        }
        if (i.step === 1) {
          i.sprite_index = "cati82";
        }
        if (i.step === 2) {
          i.sprite_index = "cati83";
        }
        if (i.step === 3) {
          i.sprite_index = "cati84";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "cati11";
        }
        if (i.step === 1) {
          i.sprite_index = "cati12";
        }
        if (i.step === 2) {
          i.sprite_index = "cati13";
        }
        if (i.step === 3) {
          i.sprite_index = "cati14";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "cati21";
        }
        if (i.step === 1) {
          i.sprite_index = "cati22";
        }
        if (i.step === 2) {
          i.sprite_index = "cati23";
        }
        if (i.step === 3) {
          i.sprite_index = "cati24";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "cati31";
        }
        if (i.step === 1) {
          i.sprite_index = "cati32";
        }
        if (i.step === 2) {
          i.sprite_index = "cati33";
        }
        if (i.step === 3) {
          i.sprite_index = "cati34";
        }
      }
    }
    if (i.action === 3) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "catt41";
        }
        if (i.step === 1) {
          i.sprite_index = "catt42";
        }
        if (i.step === 2) {
          i.sprite_index = "catt43";
        }
        if (i.step === 3) {
          i.sprite_index = "catt44";
        }
        if (i.step === 4) {
          i.sprite_index = "catt45";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "catt51";
        }
        if (i.step === 1) {
          i.sprite_index = "catt52";
        }
        if (i.step === 2) {
          i.sprite_index = "catt53";
        }
        if (i.step === 3) {
          i.sprite_index = "catt54";
        }
        if (i.step === 4) {
          i.sprite_index = "catt55";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "catt61";
        }
        if (i.step === 1) {
          i.sprite_index = "catt62";
        }
        if (i.step === 2) {
          i.sprite_index = "catt63";
        }
        if (i.step === 3) {
          i.sprite_index = "catt64";
        }
        if (i.step === 4) {
          i.sprite_index = "catt65";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "catt71";
        }
        if (i.step === 1) {
          i.sprite_index = "catt72";
        }
        if (i.step === 2) {
          i.sprite_index = "catt73";
        }
        if (i.step === 3) {
          i.sprite_index = "catt74";
        }
        if (i.step === 4) {
          i.sprite_index = "catt75";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "catt81";
        }
        if (i.step === 1) {
          i.sprite_index = "catt82";
        }
        if (i.step === 2) {
          i.sprite_index = "catt83";
        }
        if (i.step === 3) {
          i.sprite_index = "catt84";
        }
        if (i.step === 4) {
          i.sprite_index = "catt85";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "catt11";
        }
        if (i.step === 1) {
          i.sprite_index = "catt12";
        }
        if (i.step === 2) {
          i.sprite_index = "catt13";
        }
        if (i.step === 3) {
          i.sprite_index = "catt14";
        }
        if (i.step === 4) {
          i.sprite_index = "catt15";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "catt21";
        }
        if (i.step === 1) {
          i.sprite_index = "catt22";
        }
        if (i.step === 2) {
          i.sprite_index = "catt23";
        }
        if (i.step === 3) {
          i.sprite_index = "catt24";
        }
        if (i.step === 4) {
          i.sprite_index = "catt25";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "catt31";
        }
        if (i.step === 1) {
          i.sprite_index = "catt32";
        }
        if (i.step === 2) {
          i.sprite_index = "catt33";
        }
        if (i.step === 3) {
          i.sprite_index = "catt34";
        }
        if (i.step === 4) {
          i.sprite_index = "catt35";
        }
      }
    }
  },
  ally_ariete(i, w) {
    if (i.action === 0) {
      if (i.phase === 1) {
        i.sprite_index = "ara41";
      }
      if (i.phase === 2) {
        i.sprite_index = "ara51";
      }
      if (i.phase === 3) {
        i.sprite_index = "ara61";
      }
      if (i.phase === 4) {
        i.sprite_index = "ara71";
      }
      if (i.phase === 5) {
        i.sprite_index = "ara81";
      }
      if (i.phase === 6) {
        i.sprite_index = "ara11";
      }
      if (i.phase === 7) {
        i.sprite_index = "ara21";
      }
      if (i.phase === 8) {
        i.sprite_index = "ara31";
      }
    }
    if (i.action === 1) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "arm41";
        }
        if (i.step === 1) {
          i.sprite_index = "arm42";
        }
        if (i.step === 2) {
          i.sprite_index = "arm41";
        }
        if (i.step === 3) {
          i.sprite_index = "arm43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "arm51";
        }
        if (i.step === 1) {
          i.sprite_index = "arm52";
        }
        if (i.step === 2) {
          i.sprite_index = "arm51";
        }
        if (i.step === 3) {
          i.sprite_index = "arm53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "arm61";
        }
        if (i.step === 1) {
          i.sprite_index = "arm62";
        }
        if (i.step === 2) {
          i.sprite_index = "arm61";
        }
        if (i.step === 3) {
          i.sprite_index = "arm63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "arm71";
        }
        if (i.step === 1) {
          i.sprite_index = "arm72";
        }
        if (i.step === 2) {
          i.sprite_index = "arm71";
        }
        if (i.step === 3) {
          i.sprite_index = "arm73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "arm81";
        }
        if (i.step === 1) {
          i.sprite_index = "arm82";
        }
        if (i.step === 2) {
          i.sprite_index = "arm81";
        }
        if (i.step === 3) {
          i.sprite_index = "arm83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "arm11";
        }
        if (i.step === 1) {
          i.sprite_index = "arm12";
        }
        if (i.step === 2) {
          i.sprite_index = "arm11";
        }
        if (i.step === 3) {
          i.sprite_index = "arm13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "arm21";
        }
        if (i.step === 1) {
          i.sprite_index = "arm22";
        }
        if (i.step === 2) {
          i.sprite_index = "arm21";
        }
        if (i.step === 3) {
          i.sprite_index = "arm23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "arm31";
        }
        if (i.step === 1) {
          i.sprite_index = "arm32";
        }
        if (i.step === 2) {
          i.sprite_index = "arm31";
        }
        if (i.step === 3) {
          i.sprite_index = "arm33";
        }
      }
    }
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "ara41";
          }
          if (i.step === 1) {
            i.sprite_index = "ara42";
          }
          if (i.step === 2) {
            i.sprite_index = "ara43";
          }
          if (i.step === 3) {
            i.sprite_index = "ara44";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "ara51";
          }
          if (i.step === 1) {
            i.sprite_index = "ara52";
          }
          if (i.step === 2) {
            i.sprite_index = "ara53";
          }
          if (i.step === 3) {
            i.sprite_index = "ara54";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "ara61";
          }
          if (i.step === 1) {
            i.sprite_index = "ara62";
          }
          if (i.step === 2) {
            i.sprite_index = "ara63";
          }
          if (i.step === 3) {
            i.sprite_index = "ara64";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "ara71";
          }
          if (i.step === 1) {
            i.sprite_index = "ara72";
          }
          if (i.step === 2) {
            i.sprite_index = "ara73";
          }
          if (i.step === 3) {
            i.sprite_index = "ara74";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "ara81";
          }
          if (i.step === 1) {
            i.sprite_index = "ara82";
          }
          if (i.step === 2) {
            i.sprite_index = "ara83";
          }
          if (i.step === 2) {
            i.sprite_index = "ara84";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "ara11";
          }
          if (i.step === 1) {
            i.sprite_index = "ara12";
          }
          if (i.step === 2) {
            i.sprite_index = "ara13";
          }
          if (i.step === 3) {
            i.sprite_index = "ara14";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "ara21";
          }
          if (i.step === 1) {
            i.sprite_index = "ara22";
          }
          if (i.step === 2) {
            i.sprite_index = "ara23";
          }
          if (i.step === 3) {
            i.sprite_index = "ara24";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "ara31";
          }
          if (i.step === 1) {
            i.sprite_index = "ara32";
          }
          if (i.step === 2) {
            i.sprite_index = "ara33";
          }
          if (i.step === 3) {
            i.sprite_index = "ara34";
          }
        }
      }
    }
  },
  enemy_warrior(i, w) {
    if (i.action === 0) {
      if (i.phase === 1) {
        i.sprite_index = "bww61";
      }
      if (i.phase === 2) {
        i.sprite_index = "bww51";
      }
      if (i.phase === 3) {
        i.sprite_index = "bww41";
      }
      if (i.phase === 4) {
        i.sprite_index = "bww31";
      }
      if (i.phase === 5) {
        i.sprite_index = "bww21";
      }
      if (i.phase === 6) {
        i.sprite_index = "bww11";
      }
      if (i.phase === 7) {
        i.sprite_index = "bww81";
      }
      if (i.phase === 8) {
        i.sprite_index = "bww71";
      }
    }
    if (i.action === 1) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "bww61";
        }
        if (i.step === 1) {
          i.sprite_index = "bww62";
        }
        if (i.step === 2) {
          i.sprite_index = "bww61";
        }
        if (i.step === 3) {
          i.sprite_index = "bww63";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "bww51";
        }
        if (i.step === 1) {
          i.sprite_index = "bww52";
        }
        if (i.step === 2) {
          i.sprite_index = "bww51";
        }
        if (i.step === 3) {
          i.sprite_index = "bww53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "bww41";
        }
        if (i.step === 1) {
          i.sprite_index = "bww42";
        }
        if (i.step === 2) {
          i.sprite_index = "bww41";
        }
        if (i.step === 3) {
          i.sprite_index = "bww43";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "bww31";
        }
        if (i.step === 1) {
          i.sprite_index = "bww32";
        }
        if (i.step === 2) {
          i.sprite_index = "bww31";
        }
        if (i.step === 3) {
          i.sprite_index = "bww33";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "bww21";
        }
        if (i.step === 1) {
          i.sprite_index = "bww22";
        }
        if (i.step === 2) {
          i.sprite_index = "bww21";
        }
        if (i.step === 3) {
          i.sprite_index = "bww23";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "bww11";
        }
        if (i.step === 1) {
          i.sprite_index = "bww12";
        }
        if (i.step === 2) {
          i.sprite_index = "bww11";
        }
        if (i.step === 3) {
          i.sprite_index = "bww13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "bww81";
        }
        if (i.step === 1) {
          i.sprite_index = "bww82";
        }
        if (i.step === 2) {
          i.sprite_index = "bww81";
        }
        if (i.step === 3) {
          i.sprite_index = "bww83";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "bww71";
        }
        if (i.step === 1) {
          i.sprite_index = "bww72";
        }
        if (i.step === 2) {
          i.sprite_index = "bww71";
        }
        if (i.step === 3) {
          i.sprite_index = "bww73";
        }
      }
    }
    if (i.action === 2 && w.exists("ally_unit")) w.faceNearest(i, "ally_unit");
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "bwa41";
          }
          if (i.step === 1) {
            i.sprite_index = "bwa42";
          }
          if (i.step === 2) {
            i.sprite_index = "bwa43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "bwa51";
          }
          if (i.step === 1) {
            i.sprite_index = "bwa52";
          }
          if (i.step === 2) {
            i.sprite_index = "bwa53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "bwa61";
          }
          if (i.step === 1) {
            i.sprite_index = "bwa62";
          }
          if (i.step === 2) {
            i.sprite_index = "bwa63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "bwa71";
          }
          if (i.step === 1) {
            i.sprite_index = "bwa72";
          }
          if (i.step === 2) {
            i.sprite_index = "bwa73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "bwa81";
          }
          if (i.step === 1) {
            i.sprite_index = "bwa82";
          }
          if (i.step === 2) {
            i.sprite_index = "bwa83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "bwa11";
          }
          if (i.step === 1) {
            i.sprite_index = "bwa12";
          }
          if (i.step === 2) {
            i.sprite_index = "bwa13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "bwa21";
          }
          if (i.step === 1) {
            i.sprite_index = "bwa22";
          }
          if (i.step === 2) {
            i.sprite_index = "bwa23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "bwa33";
          }
          if (i.step === 1) {
            i.sprite_index = "bwa32";
          }
          if (i.step === 2) {
            i.sprite_index = "bwa33";
          }
        }
      }
    }
    if (i.action === 6) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "bfg41";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg42";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "bfg51";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg52";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "bfg61";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg62";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "bfg71";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg72";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "bfg81";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg82";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "bfg11";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg12";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "bfg21";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg22";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "bfg31";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg32";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg33";
        }
      }
    }
  },
  enemy_picchiere(i, w) {
    if (i.action === 0) {
      if (i.phase === 1) {
        i.sprite_index = "bpw41";
      }
      if (i.phase === 2) {
        i.sprite_index = "bpw51";
      }
      if (i.phase === 3) {
        i.sprite_index = "bpw61";
      }
      if (i.phase === 4) {
        i.sprite_index = "bpw71";
      }
      if (i.phase === 5) {
        i.sprite_index = "bpw81";
      }
      if (i.phase === 6) {
        i.sprite_index = "bpw11";
      }
      if (i.phase === 7) {
        i.sprite_index = "bpw21";
      }
      if (i.phase === 8) {
        i.sprite_index = "bpw31";
      }
    }
    if (i.action === 1) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "bpw41";
        }
        if (i.step === 1) {
          i.sprite_index = "bpw42";
        }
        if (i.step === 2) {
          i.sprite_index = "bpw41";
        }
        if (i.step === 3) {
          i.sprite_index = "bpw43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "bpw51";
        }
        if (i.step === 1) {
          i.sprite_index = "bpw52";
        }
        if (i.step === 2) {
          i.sprite_index = "bpw51";
        }
        if (i.step === 3) {
          i.sprite_index = "bpw53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "bpw61";
        }
        if (i.step === 1) {
          i.sprite_index = "bpw62";
        }
        if (i.step === 2) {
          i.sprite_index = "bpw61";
        }
        if (i.step === 3) {
          i.sprite_index = "bpw63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "bpw71";
        }
        if (i.step === 1) {
          i.sprite_index = "bpw72";
        }
        if (i.step === 2) {
          i.sprite_index = "bpw71";
        }
        if (i.step === 3) {
          i.sprite_index = "bpw73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "bpw81";
        }
        if (i.step === 1) {
          i.sprite_index = "bpw82";
        }
        if (i.step === 2) {
          i.sprite_index = "bpw81";
        }
        if (i.step === 3) {
          i.sprite_index = "bpw83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "bpw11";
        }
        if (i.step === 1) {
          i.sprite_index = "bpw12";
        }
        if (i.step === 2) {
          i.sprite_index = "bpw11";
        }
        if (i.step === 3) {
          i.sprite_index = "bpw13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "bpw21";
        }
        if (i.step === 1) {
          i.sprite_index = "bpw22";
        }
        if (i.step === 2) {
          i.sprite_index = "bpw21";
        }
        if (i.step === 3) {
          i.sprite_index = "bpw23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "bpw31";
        }
        if (i.step === 1) {
          i.sprite_index = "bpw32";
        }
        if (i.step === 2) {
          i.sprite_index = "bpw31";
        }
        if (i.step === 3) {
          i.sprite_index = "bpw33";
        }
      }
    }
    if (i.action === 2 && w.exists("ally_unit")) w.faceNearest(i, "ally_unit");
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "bpa41";
          }
          if (i.step === 1) {
            i.sprite_index = "bpa42";
          }
          if (i.step === 2) {
            i.sprite_index = "bpa43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "bpa51";
          }
          if (i.step === 1) {
            i.sprite_index = "bpa52";
          }
          if (i.step === 2) {
            i.sprite_index = "bpa53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "bpa61";
          }
          if (i.step === 1) {
            i.sprite_index = "bpa62";
          }
          if (i.step === 2) {
            i.sprite_index = "bpa63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "bpa71";
          }
          if (i.step === 1) {
            i.sprite_index = "bpa72";
          }
          if (i.step === 2) {
            i.sprite_index = "bpa73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "bpa81";
          }
          if (i.step === 1) {
            i.sprite_index = "bpa82";
          }
          if (i.step === 2) {
            i.sprite_index = "bpa83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "bpa11";
          }
          if (i.step === 1) {
            i.sprite_index = "bpa12";
          }
          if (i.step === 2) {
            i.sprite_index = "bpa13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "bpa21";
          }
          if (i.step === 1) {
            i.sprite_index = "bpa22";
          }
          if (i.step === 2) {
            i.sprite_index = "bpa23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "bpa33";
          }
          if (i.step === 1) {
            i.sprite_index = "bpa32";
          }
          if (i.step === 2) {
            i.sprite_index = "bpa33";
          }
        }
      }
    }
    if (i.action === 6) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "bfg41";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg42";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "bfg51";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg52";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "bfg61";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg62";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "bfg71";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg72";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "bfg81";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg82";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "bfg11";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg12";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "bfg21";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg22";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "bfg31";
        }
        if (i.step === 1) {
          i.sprite_index = "bfg32";
        }
        if (i.step === 2) {
          i.sprite_index = "bfg33";
        }
      }
    }
  },
  enemy_arciere(i, w) {
    if (i.action === 0) {
      if (i.phase === 1) {
        i.sprite_index = "baw41";
      }
      if (i.phase === 2) {
        i.sprite_index = "baw51";
      }
      if (i.phase === 3) {
        i.sprite_index = "baw61";
      }
      if (i.phase === 4) {
        i.sprite_index = "baw71";
      }
      if (i.phase === 5) {
        i.sprite_index = "baw81";
      }
      if (i.phase === 6) {
        i.sprite_index = "baw11";
      }
      if (i.phase === 7) {
        i.sprite_index = "baw21";
      }
      if (i.phase === 8) {
        i.sprite_index = "baw31";
      }
    }
    if (i.action === 1) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "baw41";
        }
        if (i.step === 1) {
          i.sprite_index = "baw42";
        }
        if (i.step === 2) {
          i.sprite_index = "baw41";
        }
        if (i.step === 3) {
          i.sprite_index = "baw43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "baw51";
        }
        if (i.step === 1) {
          i.sprite_index = "baw52";
        }
        if (i.step === 2) {
          i.sprite_index = "baw51";
        }
        if (i.step === 3) {
          i.sprite_index = "baw53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "baw61";
        }
        if (i.step === 1) {
          i.sprite_index = "baw62";
        }
        if (i.step === 2) {
          i.sprite_index = "baw61";
        }
        if (i.step === 3) {
          i.sprite_index = "baw63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "baw71";
        }
        if (i.step === 1) {
          i.sprite_index = "baw72";
        }
        if (i.step === 2) {
          i.sprite_index = "baw71";
        }
        if (i.step === 3) {
          i.sprite_index = "baw73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "baw81";
        }
        if (i.step === 1) {
          i.sprite_index = "baw82";
        }
        if (i.step === 2) {
          i.sprite_index = "baw81";
        }
        if (i.step === 3) {
          i.sprite_index = "baw83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "baw11";
        }
        if (i.step === 1) {
          i.sprite_index = "baw12";
        }
        if (i.step === 2) {
          i.sprite_index = "baw11";
        }
        if (i.step === 3) {
          i.sprite_index = "baw13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "baw21";
        }
        if (i.step === 1) {
          i.sprite_index = "baw22";
        }
        if (i.step === 2) {
          i.sprite_index = "baw21";
        }
        if (i.step === 3) {
          i.sprite_index = "baw23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "baw31";
        }
        if (i.step === 1) {
          i.sprite_index = "baw32";
        }
        if (i.step === 2) {
          i.sprite_index = "baw31";
        }
        if (i.step === 3) {
          i.sprite_index = "baw33";
        }
      }
    }
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "baa41";
          }
          if (i.step === 1) {
            i.sprite_index = "baa42";
          }
          if (i.step === 2) {
            i.sprite_index = "baa43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "baa51";
          }
          if (i.step === 1) {
            i.sprite_index = "baa52";
          }
          if (i.step === 2) {
            i.sprite_index = "baa53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "baa61";
          }
          if (i.step === 1) {
            i.sprite_index = "baa62";
          }
          if (i.step === 2) {
            i.sprite_index = "baa63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "baa71";
          }
          if (i.step === 1) {
            i.sprite_index = "baa72";
          }
          if (i.step === 2) {
            i.sprite_index = "baa73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "baa81";
          }
          if (i.step === 1) {
            i.sprite_index = "baa82";
          }
          if (i.step === 2) {
            i.sprite_index = "baa83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "baa11";
          }
          if (i.step === 1) {
            i.sprite_index = "baa12";
          }
          if (i.step === 2) {
            i.sprite_index = "baa13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "baa21";
          }
          if (i.step === 1) {
            i.sprite_index = "baa22";
          }
          if (i.step === 2) {
            i.sprite_index = "baa23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "baa31";
          }
          if (i.step === 1) {
            i.sprite_index = "baa32";
          }
          if (i.step === 2) {
            i.sprite_index = "baa33";
          }
        }
      }
    }
  },
  enemy_cavaliere(i, w) {
    if (i.action === 0) {
      if (i.phase === 1) {
        i.sprite_index = "bcw41";
      }
      if (i.phase === 2) {
        i.sprite_index = "bcw51";
      }
      if (i.phase === 3) {
        i.sprite_index = "bcw61";
      }
      if (i.phase === 4) {
        i.sprite_index = "bcw71";
      }
      if (i.phase === 5) {
        i.sprite_index = "bcw81";
      }
      if (i.phase === 6) {
        i.sprite_index = "bcw11";
      }
      if (i.phase === 7) {
        i.sprite_index = "bcw21";
      }
      if (i.phase === 8) {
        i.sprite_index = "bcw31";
      }
    }
    if (i.action === 1) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "bcw41";
        }
        if (i.step === 1) {
          i.sprite_index = "bcw42";
        }
        if (i.step === 2) {
          i.sprite_index = "bcw41";
        }
        if (i.step === 3) {
          i.sprite_index = "bcw43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "bcw51";
        }
        if (i.step === 1) {
          i.sprite_index = "bcw52";
        }
        if (i.step === 2) {
          i.sprite_index = "bcw51";
        }
        if (i.step === 3) {
          i.sprite_index = "bcw53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "bcw61";
        }
        if (i.step === 1) {
          i.sprite_index = "bcw62";
        }
        if (i.step === 2) {
          i.sprite_index = "bcw61";
        }
        if (i.step === 3) {
          i.sprite_index = "bcw63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "bcw71";
        }
        if (i.step === 1) {
          i.sprite_index = "bcw72";
        }
        if (i.step === 2) {
          i.sprite_index = "bcw71";
        }
        if (i.step === 3) {
          i.sprite_index = "bcw73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "bcw81";
        }
        if (i.step === 1) {
          i.sprite_index = "bcw82";
        }
        if (i.step === 2) {
          i.sprite_index = "bcw81";
        }
        if (i.step === 3) {
          i.sprite_index = "bcw83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "bcw11";
        }
        if (i.step === 1) {
          i.sprite_index = "bcw12";
        }
        if (i.step === 2) {
          i.sprite_index = "bcw11";
        }
        if (i.step === 3) {
          i.sprite_index = "bcw13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "bcw21";
        }
        if (i.step === 1) {
          i.sprite_index = "bcw22";
        }
        if (i.step === 2) {
          i.sprite_index = "bcw21";
        }
        if (i.step === 3) {
          i.sprite_index = "bcw23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "bcw31";
        }
        if (i.step === 1) {
          i.sprite_index = "bcw32";
        }
        if (i.step === 2) {
          i.sprite_index = "bcw31";
        }
        if (i.step === 3) {
          i.sprite_index = "bcw33";
        }
      }
    }
    if (i.action === 2 && w.exists("ally_unit")) w.faceNearest(i, "ally_unit");
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "bca41";
          }
          if (i.step === 1) {
            i.sprite_index = "bca42";
          }
          if (i.step === 2) {
            i.sprite_index = "bca43";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "bca51";
          }
          if (i.step === 1) {
            i.sprite_index = "bca52";
          }
          if (i.step === 2) {
            i.sprite_index = "bca53";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "bca61";
          }
          if (i.step === 1) {
            i.sprite_index = "bca62";
          }
          if (i.step === 2) {
            i.sprite_index = "bca63";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "bca71";
          }
          if (i.step === 1) {
            i.sprite_index = "bca72";
          }
          if (i.step === 2) {
            i.sprite_index = "bca73";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "bca81";
          }
          if (i.step === 1) {
            i.sprite_index = "bca82";
          }
          if (i.step === 2) {
            i.sprite_index = "bca83";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "bca11";
          }
          if (i.step === 1) {
            i.sprite_index = "bca12";
          }
          if (i.step === 2) {
            i.sprite_index = "bca13";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "bca21";
          }
          if (i.step === 1) {
            i.sprite_index = "bca22";
          }
          if (i.step === 2) {
            i.sprite_index = "bca23";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "bca31";
          }
          if (i.step === 1) {
            i.sprite_index = "bca32";
          }
          if (i.step === 2) {
            i.sprite_index = "bca33";
          }
        }
      }
    }
  },
  enemy_catapulta(i, w) {
    if (i.action === 0) {
      if (i.phase === 1) {
        i.sprite_index = "bcati41";
      }
      if (i.phase === 2) {
        i.sprite_index = "bcati51";
      }
      if (i.phase === 3) {
        i.sprite_index = "bcati61";
      }
      if (i.phase === 4) {
        i.sprite_index = "bcati71";
      }
      if (i.phase === 5) {
        i.sprite_index = "bcati81";
      }
      if (i.phase === 6) {
        i.sprite_index = "bcati11";
      }
      if (i.phase === 7) {
        i.sprite_index = "bcati21";
      }
      if (i.phase === 8) {
        i.sprite_index = "bcati31";
      }
    }
    if (i.action === 1) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "bcatm41";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatm42";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatm41";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatm43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "bcatm51";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatm52";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatm51";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatm53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "bcatm61";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatm62";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatm61";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatm63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "bcatm71";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatm72";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatm71";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatm73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "bcatm81";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatm82";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatm81";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatm83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "bcatm11";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatm12";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatm11";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatm13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "bcatm21";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatm22";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatm21";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatm23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "bcatm31";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatm32";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatm31";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatm33";
        }
      }
    }
    if (i.action === 2) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "bcati41";
        }
        if (i.step === 1) {
          i.sprite_index = "bcati42";
        }
        if (i.step === 2) {
          i.sprite_index = "bcati43";
        }
        if (i.step === 3) {
          i.sprite_index = "bcati44";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "bcati51";
        }
        if (i.step === 1) {
          i.sprite_index = "bcati52";
        }
        if (i.step === 2) {
          i.sprite_index = "bcati53";
        }
        if (i.step === 3) {
          i.sprite_index = "bcati54";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "bcati61";
        }
        if (i.step === 1) {
          i.sprite_index = "bcati62";
        }
        if (i.step === 2) {
          i.sprite_index = "bcati63";
        }
        if (i.step === 3) {
          i.sprite_index = "bcati64";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "bcati71";
        }
        if (i.step === 1) {
          i.sprite_index = "bcati72";
        }
        if (i.step === 2) {
          i.sprite_index = "bcati73";
        }
        if (i.step === 3) {
          i.sprite_index = "bcati74";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "bcati81";
        }
        if (i.step === 1) {
          i.sprite_index = "bcati82";
        }
        if (i.step === 2) {
          i.sprite_index = "bcati83";
        }
        if (i.step === 3) {
          i.sprite_index = "bcati84";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "bcati11";
        }
        if (i.step === 1) {
          i.sprite_index = "bcati12";
        }
        if (i.step === 2) {
          i.sprite_index = "bcati13";
        }
        if (i.step === 3) {
          i.sprite_index = "bcati14";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "bcati21";
        }
        if (i.step === 1) {
          i.sprite_index = "bcati22";
        }
        if (i.step === 2) {
          i.sprite_index = "bcati23";
        }
        if (i.step === 3) {
          i.sprite_index = "bcati24";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "bcati31";
        }
        if (i.step === 1) {
          i.sprite_index = "bcati32";
        }
        if (i.step === 2) {
          i.sprite_index = "bcati33";
        }
        if (i.step === 3) {
          i.sprite_index = "bcati34";
        }
      }
    }
    if (i.action === 3) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "bcatt41";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatt42";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatt43";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatt44";
        }
        if (i.step === 4) {
          i.sprite_index = "bcatt45";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "bcatt51";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatt52";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatt53";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatt54";
        }
        if (i.step === 4) {
          i.sprite_index = "bcatt55";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "bcatt61";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatt62";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatt63";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatt64";
        }
        if (i.step === 4) {
          i.sprite_index = "bcatt65";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "bcatt71";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatt72";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatt73";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatt74";
        }
        if (i.step === 4) {
          i.sprite_index = "bcatt75";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "bcatt81";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatt82";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatt83";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatt84";
        }
        if (i.step === 4) {
          i.sprite_index = "bcatt85";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "bcatt11";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatt12";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatt13";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatt14";
        }
        if (i.step === 4) {
          i.sprite_index = "bcatt15";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "bcatt21";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatt22";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatt23";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatt24";
        }
        if (i.step === 4) {
          i.sprite_index = "bcatt25";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "bcatt31";
        }
        if (i.step === 1) {
          i.sprite_index = "bcatt32";
        }
        if (i.step === 2) {
          i.sprite_index = "bcatt33";
        }
        if (i.step === 3) {
          i.sprite_index = "bcatt34";
        }
        if (i.step === 4) {
          i.sprite_index = "bcatt35";
        }
      }
    }
  },
  enemy_ariete(i, w) {
    if (i.action === 0) {
      if (i.phase === 1) {
        i.sprite_index = "bara41";
      }
      if (i.phase === 2) {
        i.sprite_index = "bara51";
      }
      if (i.phase === 3) {
        i.sprite_index = "bara61";
      }
      if (i.phase === 4) {
        i.sprite_index = "bara71";
      }
      if (i.phase === 5) {
        i.sprite_index = "bara81";
      }
      if (i.phase === 6) {
        i.sprite_index = "bara11";
      }
      if (i.phase === 7) {
        i.sprite_index = "bara21";
      }
      if (i.phase === 8) {
        i.sprite_index = "bara31";
      }
    }
    if (i.action === 1) {
      if (i.phase === 1) {
        if (i.step === 0) {
          i.sprite_index = "barm41";
        }
        if (i.step === 1) {
          i.sprite_index = "barm42";
        }
        if (i.step === 2) {
          i.sprite_index = "barm41";
        }
        if (i.step === 3) {
          i.sprite_index = "barm43";
        }
      }
      if (i.phase === 2) {
        if (i.step === 0) {
          i.sprite_index = "barm51";
        }
        if (i.step === 1) {
          i.sprite_index = "barm52";
        }
        if (i.step === 2) {
          i.sprite_index = "barm51";
        }
        if (i.step === 3) {
          i.sprite_index = "barm53";
        }
      }
      if (i.phase === 3) {
        if (i.step === 0) {
          i.sprite_index = "barm61";
        }
        if (i.step === 1) {
          i.sprite_index = "barm62";
        }
        if (i.step === 2) {
          i.sprite_index = "barm61";
        }
        if (i.step === 3) {
          i.sprite_index = "barm63";
        }
      }
      if (i.phase === 4) {
        if (i.step === 0) {
          i.sprite_index = "barm71";
        }
        if (i.step === 1) {
          i.sprite_index = "barm72";
        }
        if (i.step === 2) {
          i.sprite_index = "barm71";
        }
        if (i.step === 3) {
          i.sprite_index = "barm73";
        }
      }
      if (i.phase === 5) {
        if (i.step === 0) {
          i.sprite_index = "barm81";
        }
        if (i.step === 1) {
          i.sprite_index = "barm82";
        }
        if (i.step === 2) {
          i.sprite_index = "barm81";
        }
        if (i.step === 3) {
          i.sprite_index = "barm83";
        }
      }
      if (i.phase === 6) {
        if (i.step === 0) {
          i.sprite_index = "barm11";
        }
        if (i.step === 1) {
          i.sprite_index = "barm12";
        }
        if (i.step === 2) {
          i.sprite_index = "barm11";
        }
        if (i.step === 3) {
          i.sprite_index = "barm13";
        }
      }
      if (i.phase === 7) {
        if (i.step === 0) {
          i.sprite_index = "barm21";
        }
        if (i.step === 1) {
          i.sprite_index = "barm22";
        }
        if (i.step === 2) {
          i.sprite_index = "barm21";
        }
        if (i.step === 3) {
          i.sprite_index = "barm23";
        }
      }
      if (i.phase === 8) {
        if (i.step === 0) {
          i.sprite_index = "barm31";
        }
        if (i.step === 1) {
          i.sprite_index = "barm32";
        }
        if (i.step === 2) {
          i.sprite_index = "barm31";
        }
        if (i.step === 3) {
          i.sprite_index = "barm33";
        }
      }
    }
    if (i.action >= 2) {
      if (i.action < 6) {
        if (i.phase === 1) {
          if (i.step === 0) {
            i.sprite_index = "bara41";
          }
          if (i.step === 1) {
            i.sprite_index = "bara42";
          }
          if (i.step === 2) {
            i.sprite_index = "bara43";
          }
          if (i.step === 3) {
            i.sprite_index = "bara44";
          }
        }
        if (i.phase === 2) {
          if (i.step === 0) {
            i.sprite_index = "bara51";
          }
          if (i.step === 1) {
            i.sprite_index = "bara52";
          }
          if (i.step === 2) {
            i.sprite_index = "bara53";
          }
          if (i.step === 3) {
            i.sprite_index = "bara54";
          }
        }
        if (i.phase === 3) {
          if (i.step === 0) {
            i.sprite_index = "bara61";
          }
          if (i.step === 1) {
            i.sprite_index = "bara62";
          }
          if (i.step === 2) {
            i.sprite_index = "bara63";
          }
          if (i.step === 3) {
            i.sprite_index = "bara64";
          }
        }
        if (i.phase === 4) {
          if (i.step === 0) {
            i.sprite_index = "bara71";
          }
          if (i.step === 1) {
            i.sprite_index = "bara72";
          }
          if (i.step === 2) {
            i.sprite_index = "bara73";
          }
          if (i.step === 3) {
            i.sprite_index = "bara74";
          }
        }
        if (i.phase === 5) {
          if (i.step === 0) {
            i.sprite_index = "bara81";
          }
          if (i.step === 1) {
            i.sprite_index = "bara82";
          }
          if (i.step === 2) {
            i.sprite_index = "bara83";
          }
          if (i.step === 2) {
            i.sprite_index = "bara84";
          }
        }
        if (i.phase === 6) {
          if (i.step === 0) {
            i.sprite_index = "bara11";
          }
          if (i.step === 1) {
            i.sprite_index = "bara12";
          }
          if (i.step === 2) {
            i.sprite_index = "bara13";
          }
          if (i.step === 3) {
            i.sprite_index = "bara14";
          }
        }
        if (i.phase === 7) {
          if (i.step === 0) {
            i.sprite_index = "bara21";
          }
          if (i.step === 1) {
            i.sprite_index = "bara22";
          }
          if (i.step === 2) {
            i.sprite_index = "bara23";
          }
          if (i.step === 3) {
            i.sprite_index = "bara24";
          }
        }
        if (i.phase === 8) {
          if (i.step === 0) {
            i.sprite_index = "bara31";
          }
          if (i.step === 1) {
            i.sprite_index = "bara32";
          }
          if (i.step === 2) {
            i.sprite_index = "bara33";
          }
          if (i.step === 3) {
            i.sprite_index = "bara34";
          }
        }
      }
    }
  },
  warrior_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "wc41";
      }
      if (i.step === 1) {
        i.sprite_index = "wc42";
      }
      if (i.step === 2) {
        i.sprite_index = "wc43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "wc51";
      }
      if (i.step === 1) {
        i.sprite_index = "wc52";
      }
      if (i.step === 2) {
        i.sprite_index = "wc53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "wc61";
      }
      if (i.step === 1) {
        i.sprite_index = "wc62";
      }
      if (i.step === 2) {
        i.sprite_index = "wc63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "wc71";
      }
      if (i.step === 1) {
        i.sprite_index = "wc72";
      }
      if (i.step === 2) {
        i.sprite_index = "wc73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "wc81";
      }
      if (i.step === 1) {
        i.sprite_index = "wc82";
      }
      if (i.step === 2) {
        i.sprite_index = "wc83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "wc11";
      }
      if (i.step === 1) {
        i.sprite_index = "wc12";
      }
      if (i.step === 2) {
        i.sprite_index = "wc13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "wc21";
      }
      if (i.step === 1) {
        i.sprite_index = "wc22";
      }
      if (i.step === 2) {
        i.sprite_index = "wc23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "wc31";
      }
      if (i.step === 1) {
        i.sprite_index = "wc32";
      }
      if (i.step === 2) {
        i.sprite_index = "wc33";
      }
    }
  },
  picchiere_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "pc41";
      }
      if (i.step === 1) {
        i.sprite_index = "pc42";
      }
      if (i.step === 2) {
        i.sprite_index = "pc43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "pc51";
      }
      if (i.step === 1) {
        i.sprite_index = "pc52";
      }
      if (i.step === 2) {
        i.sprite_index = "pc53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "pc61";
      }
      if (i.step === 1) {
        i.sprite_index = "pc62";
      }
      if (i.step === 2) {
        i.sprite_index = "pc63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "pc71";
      }
      if (i.step === 1) {
        i.sprite_index = "pc72";
      }
      if (i.step === 2) {
        i.sprite_index = "pc73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "pc81";
      }
      if (i.step === 1) {
        i.sprite_index = "pc82";
      }
      if (i.step === 2) {
        i.sprite_index = "pc83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "pc11";
      }
      if (i.step === 1) {
        i.sprite_index = "pc12";
      }
      if (i.step === 2) {
        i.sprite_index = "pc13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "pc21";
      }
      if (i.step === 1) {
        i.sprite_index = "pc22";
      }
      if (i.step === 2) {
        i.sprite_index = "pc23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "pc31";
      }
      if (i.step === 1) {
        i.sprite_index = "pc32";
      }
      if (i.step === 2) {
        i.sprite_index = "pc33";
      }
    }
  },
  arciere_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "ac41";
      }
      if (i.step === 1) {
        i.sprite_index = "ac42";
      }
      if (i.step === 2) {
        i.sprite_index = "ac43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "ac51";
      }
      if (i.step === 1) {
        i.sprite_index = "ac52";
      }
      if (i.step === 2) {
        i.sprite_index = "ac53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "ac61";
      }
      if (i.step === 1) {
        i.sprite_index = "ac62";
      }
      if (i.step === 2) {
        i.sprite_index = "ac63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "ac71";
      }
      if (i.step === 1) {
        i.sprite_index = "ac72";
      }
      if (i.step === 2) {
        i.sprite_index = "ac73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "ac81";
      }
      if (i.step === 1) {
        i.sprite_index = "ac82";
      }
      if (i.step === 2) {
        i.sprite_index = "ac83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "ac11";
      }
      if (i.step === 1) {
        i.sprite_index = "ac12";
      }
      if (i.step === 2) {
        i.sprite_index = "ac13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "ac21";
      }
      if (i.step === 1) {
        i.sprite_index = "ac22";
      }
      if (i.step === 2) {
        i.sprite_index = "ac23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "ac31";
      }
      if (i.step === 1) {
        i.sprite_index = "ac32";
      }
      if (i.step === 2) {
        i.sprite_index = "ac33";
      }
    }
  },
  cavaliere_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "cc41";
      }
      if (i.step === 1) {
        i.sprite_index = "cc42";
      }
      if (i.step === 2) {
        i.sprite_index = "cc43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "cc51";
      }
      if (i.step === 1) {
        i.sprite_index = "cc52";
      }
      if (i.step === 2) {
        i.sprite_index = "cc53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "cc61";
      }
      if (i.step === 1) {
        i.sprite_index = "cc62";
      }
      if (i.step === 2) {
        i.sprite_index = "cc63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "cc71";
      }
      if (i.step === 1) {
        i.sprite_index = "cc72";
      }
      if (i.step === 2) {
        i.sprite_index = "cc73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "cc81";
      }
      if (i.step === 1) {
        i.sprite_index = "cc82";
      }
      if (i.step === 2) {
        i.sprite_index = "cc83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "cc11";
      }
      if (i.step === 1) {
        i.sprite_index = "cc12";
      }
      if (i.step === 2) {
        i.sprite_index = "cc13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "cc21";
      }
      if (i.step === 1) {
        i.sprite_index = "cc22";
      }
      if (i.step === 2) {
        i.sprite_index = "cc23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "cc31";
      }
      if (i.step === 1) {
        i.sprite_index = "cc32";
      }
      if (i.step === 2) {
        i.sprite_index = "cc33";
      }
    }
  },
  omino_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "oc41";
      }
      if (i.step === 1) {
        i.sprite_index = "oc42";
      }
      if (i.step === 2) {
        i.sprite_index = "oc43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "oc51";
      }
      if (i.step === 1) {
        i.sprite_index = "oc52";
      }
      if (i.step === 2) {
        i.sprite_index = "oc53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "oc61";
      }
      if (i.step === 1) {
        i.sprite_index = "oc62";
      }
      if (i.step === 2) {
        i.sprite_index = "oc63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "oc71";
      }
      if (i.step === 1) {
        i.sprite_index = "oc72";
      }
      if (i.step === 2) {
        i.sprite_index = "oc73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "oc81";
      }
      if (i.step === 1) {
        i.sprite_index = "oc82";
      }
      if (i.step === 2) {
        i.sprite_index = "oc83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "oc11";
      }
      if (i.step === 1) {
        i.sprite_index = "oc12";
      }
      if (i.step === 2) {
        i.sprite_index = "oc13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "oc21";
      }
      if (i.step === 1) {
        i.sprite_index = "oc22";
      }
      if (i.step === 2) {
        i.sprite_index = "oc23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "oc31";
      }
      if (i.step === 1) {
        i.sprite_index = "oc32";
      }
      if (i.step === 2) {
        i.sprite_index = "oc33";
      }
    }
  },
  catapulta_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "catc41";
      }
      if (i.step === 1) {
        i.sprite_index = "catc42";
      }
      if (i.step === 2) {
        i.sprite_index = "catc43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "catc51";
      }
      if (i.step === 1) {
        i.sprite_index = "catc52";
      }
      if (i.step === 2) {
        i.sprite_index = "catc53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "catc61";
      }
      if (i.step === 1) {
        i.sprite_index = "catc62";
      }
      if (i.step === 2) {
        i.sprite_index = "catc63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "catc71";
      }
      if (i.step === 1) {
        i.sprite_index = "catc72";
      }
      if (i.step === 2) {
        i.sprite_index = "catc73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "catc81";
      }
      if (i.step === 1) {
        i.sprite_index = "catc82";
      }
      if (i.step === 2) {
        i.sprite_index = "catc83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "catc11";
      }
      if (i.step === 1) {
        i.sprite_index = "catc12";
      }
      if (i.step === 2) {
        i.sprite_index = "catc13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "catc21";
      }
      if (i.step === 1) {
        i.sprite_index = "catc22";
      }
      if (i.step === 2) {
        i.sprite_index = "catc23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "catc31";
      }
      if (i.step === 1) {
        i.sprite_index = "catc32";
      }
      if (i.step === 2) {
        i.sprite_index = "catc33";
      }
    }
  },
  ariete_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "arc41";
      }
      if (i.step === 1) {
        i.sprite_index = "arc42";
      }
      if (i.step === 2) {
        i.sprite_index = "arc43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "arc51";
      }
      if (i.step === 1) {
        i.sprite_index = "arc52";
      }
      if (i.step === 2) {
        i.sprite_index = "arc53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "arc61";
      }
      if (i.step === 1) {
        i.sprite_index = "arc62";
      }
      if (i.step === 2) {
        i.sprite_index = "arc63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "arc71";
      }
      if (i.step === 1) {
        i.sprite_index = "arc72";
      }
      if (i.step === 2) {
        i.sprite_index = "arc73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "arc81";
      }
      if (i.step === 1) {
        i.sprite_index = "arc82";
      }
      if (i.step === 2) {
        i.sprite_index = "arc83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "arc11";
      }
      if (i.step === 1) {
        i.sprite_index = "arc12";
      }
      if (i.step === 2) {
        i.sprite_index = "arc13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "arc21";
      }
      if (i.step === 1) {
        i.sprite_index = "arc22";
      }
      if (i.step === 2) {
        i.sprite_index = "arc23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "arc31";
      }
      if (i.step === 1) {
        i.sprite_index = "arc32";
      }
      if (i.step === 2) {
        i.sprite_index = "arc33";
      }
    }
  },
  enemy_warrior_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "bwc41";
      }
      if (i.step === 1) {
        i.sprite_index = "bwc42";
      }
      if (i.step === 2) {
        i.sprite_index = "bwc43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "bwc51";
      }
      if (i.step === 1) {
        i.sprite_index = "bwc52";
      }
      if (i.step === 2) {
        i.sprite_index = "bwc53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "bwc61";
      }
      if (i.step === 1) {
        i.sprite_index = "bwc62";
      }
      if (i.step === 2) {
        i.sprite_index = "bwc63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "bwc71";
      }
      if (i.step === 1) {
        i.sprite_index = "bwc72";
      }
      if (i.step === 2) {
        i.sprite_index = "bwc73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "bwc81";
      }
      if (i.step === 1) {
        i.sprite_index = "bwc82";
      }
      if (i.step === 2) {
        i.sprite_index = "bwc83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "bwc11";
      }
      if (i.step === 1) {
        i.sprite_index = "bwc12";
      }
      if (i.step === 2) {
        i.sprite_index = "bwc13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "bwc21";
      }
      if (i.step === 1) {
        i.sprite_index = "bwc22";
      }
      if (i.step === 2) {
        i.sprite_index = "bwc23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "bwc31";
      }
      if (i.step === 1) {
        i.sprite_index = "bwc32";
      }
      if (i.step === 2) {
        i.sprite_index = "bwc33";
      }
    }
  },
  enemy_picchiere_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "bpd41";
      }
      if (i.step === 1) {
        i.sprite_index = "bpd42";
      }
      if (i.step === 2) {
        i.sprite_index = "bpd43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "bpd51";
      }
      if (i.step === 1) {
        i.sprite_index = "bpd52";
      }
      if (i.step === 2) {
        i.sprite_index = "bpd53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "bpd61";
      }
      if (i.step === 1) {
        i.sprite_index = "bpd62";
      }
      if (i.step === 2) {
        i.sprite_index = "bpd63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "bpd71";
      }
      if (i.step === 1) {
        i.sprite_index = "bpd72";
      }
      if (i.step === 2) {
        i.sprite_index = "bpd73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "bpd81";
      }
      if (i.step === 1) {
        i.sprite_index = "bpd82";
      }
      if (i.step === 2) {
        i.sprite_index = "bpd83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "bpd11";
      }
      if (i.step === 1) {
        i.sprite_index = "bpd12";
      }
      if (i.step === 2) {
        i.sprite_index = "bpd13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "bpd21";
      }
      if (i.step === 1) {
        i.sprite_index = "bpd22";
      }
      if (i.step === 2) {
        i.sprite_index = "bpd23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "bpd31";
      }
      if (i.step === 1) {
        i.sprite_index = "bpd32";
      }
      if (i.step === 2) {
        i.sprite_index = "bpd33";
      }
    }
  },
  enemy_arciere_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "bac41";
      }
      if (i.step === 1) {
        i.sprite_index = "bac42";
      }
      if (i.step === 2) {
        i.sprite_index = "bac43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "bac51";
      }
      if (i.step === 1) {
        i.sprite_index = "bac52";
      }
      if (i.step === 2) {
        i.sprite_index = "bac53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "bac61";
      }
      if (i.step === 1) {
        i.sprite_index = "bac62";
      }
      if (i.step === 2) {
        i.sprite_index = "bac63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "bac71";
      }
      if (i.step === 1) {
        i.sprite_index = "bac72";
      }
      if (i.step === 2) {
        i.sprite_index = "bac73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "bac81";
      }
      if (i.step === 1) {
        i.sprite_index = "bac82";
      }
      if (i.step === 2) {
        i.sprite_index = "bac83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "bac11";
      }
      if (i.step === 1) {
        i.sprite_index = "bac12";
      }
      if (i.step === 2) {
        i.sprite_index = "bac13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "bac21";
      }
      if (i.step === 1) {
        i.sprite_index = "bac22";
      }
      if (i.step === 2) {
        i.sprite_index = "bac23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "bac31";
      }
      if (i.step === 1) {
        i.sprite_index = "bac32";
      }
      if (i.step === 2) {
        i.sprite_index = "bac33";
      }
    }
  },
  enemy_cavaliere_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "bcd41";
      }
      if (i.step === 1) {
        i.sprite_index = "bcd42";
      }
      if (i.step === 2) {
        i.sprite_index = "bcd43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "bcd51";
      }
      if (i.step === 1) {
        i.sprite_index = "bcd52";
      }
      if (i.step === 2) {
        i.sprite_index = "bcd53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "bcd61";
      }
      if (i.step === 1) {
        i.sprite_index = "bcd62";
      }
      if (i.step === 2) {
        i.sprite_index = "bcd63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "bcd71";
      }
      if (i.step === 1) {
        i.sprite_index = "bcd72";
      }
      if (i.step === 2) {
        i.sprite_index = "bcd73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "bcd81";
      }
      if (i.step === 1) {
        i.sprite_index = "bcd82";
      }
      if (i.step === 2) {
        i.sprite_index = "bcd83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "bcd11";
      }
      if (i.step === 1) {
        i.sprite_index = "bcd12";
      }
      if (i.step === 2) {
        i.sprite_index = "bcd13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "bcd21";
      }
      if (i.step === 1) {
        i.sprite_index = "bcd22";
      }
      if (i.step === 2) {
        i.sprite_index = "bcd23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "bcd31";
      }
      if (i.step === 1) {
        i.sprite_index = "bcd32";
      }
      if (i.step === 2) {
        i.sprite_index = "bcd33";
      }
    }
  },
  enemy_catapulta_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "bcatc41";
      }
      if (i.step === 1) {
        i.sprite_index = "bcatc42";
      }
      if (i.step === 2) {
        i.sprite_index = "bcatc43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "bcatc51";
      }
      if (i.step === 1) {
        i.sprite_index = "bcatc52";
      }
      if (i.step === 2) {
        i.sprite_index = "bcatc53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "bcatc61";
      }
      if (i.step === 1) {
        i.sprite_index = "bcatc62";
      }
      if (i.step === 2) {
        i.sprite_index = "bcatc63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "bcatc71";
      }
      if (i.step === 1) {
        i.sprite_index = "bcatc72";
      }
      if (i.step === 2) {
        i.sprite_index = "bcatc73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "bcatc81";
      }
      if (i.step === 1) {
        i.sprite_index = "bcatc82";
      }
      if (i.step === 2) {
        i.sprite_index = "bcatc83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "bcatc11";
      }
      if (i.step === 1) {
        i.sprite_index = "bcatc12";
      }
      if (i.step === 2) {
        i.sprite_index = "bcatc13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "bcatc21";
      }
      if (i.step === 1) {
        i.sprite_index = "bcatc22";
      }
      if (i.step === 2) {
        i.sprite_index = "bcatc23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "bcatc31";
      }
      if (i.step === 1) {
        i.sprite_index = "bcatc32";
      }
      if (i.step === 2) {
        i.sprite_index = "bcatc33";
      }
    }
  },
  enemy_ariete_corpse(i, w) {
    if (i.phase === 1) {
      if (i.step === 0) {
        i.sprite_index = "bard41";
      }
      if (i.step === 1) {
        i.sprite_index = "bard42";
      }
      if (i.step === 2) {
        i.sprite_index = "bard43";
      }
    }
    if (i.phase === 2) {
      if (i.step === 0) {
        i.sprite_index = "bard51";
      }
      if (i.step === 1) {
        i.sprite_index = "bard52";
      }
      if (i.step === 2) {
        i.sprite_index = "bard53";
      }
    }
    if (i.phase === 3) {
      if (i.step === 0) {
        i.sprite_index = "bard61";
      }
      if (i.step === 1) {
        i.sprite_index = "bard62";
      }
      if (i.step === 2) {
        i.sprite_index = "bard63";
      }
    }
    if (i.phase === 4) {
      if (i.step === 0) {
        i.sprite_index = "bard71";
      }
      if (i.step === 1) {
        i.sprite_index = "bard72";
      }
      if (i.step === 2) {
        i.sprite_index = "bard73";
      }
    }
    if (i.phase === 5) {
      if (i.step === 0) {
        i.sprite_index = "bard81";
      }
      if (i.step === 1) {
        i.sprite_index = "bard82";
      }
      if (i.step === 2) {
        i.sprite_index = "bard83";
      }
    }
    if (i.phase === 6) {
      if (i.step === 0) {
        i.sprite_index = "bard11";
      }
      if (i.step === 1) {
        i.sprite_index = "bard12";
      }
      if (i.step === 2) {
        i.sprite_index = "bard13";
      }
    }
    if (i.phase === 7) {
      if (i.step === 0) {
        i.sprite_index = "bard21";
      }
      if (i.step === 1) {
        i.sprite_index = "bard22";
      }
      if (i.step === 2) {
        i.sprite_index = "bard23";
      }
    }
    if (i.phase === 8) {
      if (i.step === 0) {
        i.sprite_index = "bard31";
      }
      if (i.step === 1) {
        i.sprite_index = "bard32";
      }
      if (i.step === 2) {
        i.sprite_index = "bard33";
      }
    }
  },
};
