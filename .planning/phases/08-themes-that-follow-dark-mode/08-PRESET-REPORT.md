# Phase 08 preset admission report

Numerical admission of every requested entry is complete. Actual Chrome/native-state and human acceptance remain pending.

## Ordered admission manifest

All eight PASS; no optional candidate was omitted and no required capability dropped. Each per-variant digest is SHA256 of UTF-8 `JSON.stringify(record.variants)` in canonical stored key order. Exact accepted numeric-data digest is `d4db43244d51bb19c0514d29988dd16a2b7334443c42f9d5ccc232272a5e84ce`: SHA256 of UTF-8 `JSON.stringify(records.map(r => ({id:r.id,variants:r.variants})))` in this ordered manifest. Tests bind this report to final runtime data and execute every accepted ID through resolution and settings.

<!-- admission-manifest -->
```json
{
  "dataDigest": "d4db43244d51bb19c0514d29988dd16a2b7334443c42f9d5ccc232272a5e84ce",
  "candidates": [
    {
      "id": "zhroma-classic",
      "label": "Classic",
      "verdict": "pass",
      "variantsSha256": "4530435af7e7b75c89afc69904d7c0a5d4d80f01b824358868f710e14bedef11"
    },
    {
      "id": "zhroma-catppuccin",
      "label": "Catppuccin",
      "verdict": "pass",
      "variantsSha256": "db93a70322a6e759ebf071812434bb06ddcde94cfdb27447e616fd8917f42811",
      "repository": "catppuccin/catppuccin",
      "commit": "d09787dd98ca6fba08af5ef2ae94a7e09f17daca",
      "paletteSha256": "6f5151cdd4fe3e94dac978a9b88444c888698af37ff8e654088cd043d33411b2",
      "licenceSha256": "814096d2c34cc216c624738a49356f32b7237733b4f7edb0685f4e50ef5074ba",
      "noticeRepresentation": "exact-comment-text",
      "bundledNoticeSha256": "814096d2c34cc216c624738a49356f32b7237733b4f7edb0685f4e50ef5074ba"
    },
    {
      "id": "zhroma-tokyo-night",
      "label": "Tokyo Night",
      "verdict": "pass",
      "variantsSha256": "2ca857f39a62b3764dcc32ce4ebb9940fde22f790cede1d57a08ac6ec4f3e1f4",
      "repository": "enkia/tokyo-night-vscode-theme",
      "commit": "7c0f11eaef322f293621ca7befe462214b7ea468",
      "paletteSha256": "576b7254966a979d13f4ff0fa13d7e2bebcb36087f1e00b264fa5dc5e4f620cd",
      "licenceSha256": "e3f5d0d772cda0f4f67405696f15a0f335460a2b3944eff40f00675aadacb31b",
      "noticeRepresentation": "exact-comment-text",
      "bundledNoticeSha256": "e3f5d0d772cda0f4f67405696f15a0f335460a2b3944eff40f00675aadacb31b"
    },
    {
      "id": "zhroma-dracula",
      "label": "Dracula",
      "verdict": "pass",
      "variantsSha256": "f3d1b9d7af170a2dfdaab0731d908dc7b6f02e5f418ad3fd96f636c0c02872b7",
      "repository": "dracula/dracula-theme",
      "commit": "e22ebcc048b8aff586f9bc94db30ff5347070b42",
      "paletteSha256": "3f798014d8e25a4c15f6ad26bc767d99bfc367ec3f9883bd4b5ce0fe562647d0",
      "licenceSha256": "38b806a7e799cca4e9821e6f8d65cf0d8bfaaddbe454b41f12e5baad52d310f1",
      "noticeRepresentation": "exact-comment-text",
      "bundledNoticeSha256": "38b806a7e799cca4e9821e6f8d65cf0d8bfaaddbe454b41f12e5baad52d310f1"
    },
    {
      "id": "zhroma-nord",
      "label": "Nord",
      "verdict": "pass",
      "variantsSha256": "707f2c308b8dadea96c6267b4b732207c1b3e03c823c743edfb339f8d361e6b0",
      "repository": "nordtheme/nord",
      "commit": "1cef71605416a222e57225b544540ce0fcec18d4",
      "paletteSha256": "b931ac3732582b2066b2d6cadec02d9820ba7081e6e3e404c31cb62d9315a962",
      "licenceSha256": "25ac8188d670bd2ad2ce2f4f55ab88573010ee9f7a4502543cb1eea1e2274f8a",
      "noticeRepresentation": "decoded-registry-string",
      "rawNoticeRepresentationSha256": "84b7a78d0c50b31490018b2036388d7c6bb255ea1f85deebe5b14168e9a326f2",
      "bundledNoticeSha256": "25ac8188d670bd2ad2ce2f4f55ab88573010ee9f7a4502543cb1eea1e2274f8a"
    },
    {
      "id": "zhroma-gruvbox",
      "label": "Gruvbox",
      "verdict": "pass",
      "variantsSha256": "13c29917e878e037079d58ca81564f937e4e48ad2f2ec960bf50855e661ff017",
      "repository": "ellisonleao/gruvbox.nvim",
      "commit": "154eb5ff5b96d0641307113fa385eaf0d36d9796",
      "paletteSha256": "305e6750f877f582c37a20bb9db1528be95da154815a31ac676142f64fa82690",
      "licenceSha256": "40f9e21e8e8bd3e740665c27945b6d6bf8afbc8008439aa749cb477157390524",
      "noticeRepresentation": "exact-comment-text",
      "bundledNoticeSha256": "40f9e21e8e8bd3e740665c27945b6d6bf8afbc8008439aa749cb477157390524"
    },
    {
      "id": "zhroma-solarized",
      "label": "Solarized",
      "verdict": "pass",
      "variantsSha256": "ec1cd877f445c9c67adc3a66ad9294c0317d552a5bb8ba001002fabf84b71195",
      "repository": "altercation/solarized",
      "commit": "62f656a02f93c5190a8753159e34b385588d5ff3",
      "paletteSha256": "f10571c994648365faab9c4f83bdd7699aa2cd056f111af5e29099c2673c5bc1",
      "licenceSha256": "494aefdabf86acce06bd63001ad8aedad4ee38da23509d3f917d95aa3368b9a6",
      "noticeRepresentation": "exact-comment-text",
      "bundledNoticeSha256": "494aefdabf86acce06bd63001ad8aedad4ee38da23509d3f917d95aa3368b9a6"
    },
    {
      "id": "zhroma-colourblind-safe",
      "label": "Colourblind-safe",
      "verdict": "pass",
      "variantsSha256": "8af862f94cf8ac70b83b48f7800dbb2bc05ab38bbc04a7d3e298576d2d35bdb2"
    }
  ]
}
```
<!-- /admission-manifest -->

## Ordinary admission and custody

Ordinary mappings retain Urgent red / High orange / Normal yellow / Low green in both modes. No priority hue changes or remappings were required. Opacity was tuned first: `tuneOrdinary` enumerates .06..40 inclusive in .02 steps per priority, prechecks contrast/untinted/native transition constraints, and retains the passing combination with smallest summed opacity; canonical lexicographic traversal breaks ties. Candidate tests additionally reproduce the chosen final alphas. Unmapped slots use .12, except the previously accepted Classic and Catppuccin data retained exactly.

Every cached primary palette/licence file was SHA256 checked against the research's exact commit/pair before data admission. Dracula uses the corrected full 64-character README hash. Full copyright/permission notices ship separately for each brand, even where MIT paragraphs repeat. Comment text, or Nord's decoded registry notice, hashes byte-for-byte to the source licence. Nord's exact notice includes its original author website: only slash characters in the JS literal are represented with Unicode escapes so the raw static source has no protocol URL; decoded notice text is unaltered. The manifest distinguishes that raw representation digest from its exact decoded notice digest. This is representation only, no network operation.

Gruvbox uses ellisonleao/gruvbox.nvim commit `154eb5ff5b96d0641307113fa385eaf0d36d9796`, its complete MIT notice (NpX, 2021), and explicitly credits original morhetz lineage. The pinned original morhetz README declares MIT/X11; no GPL claim or permission waiver is made. Classic credits original Zhroma and immutable baseline source; no third-party or repository-wide licence is invented.

| Preset | Source variants and slot derivations | Packaged notice location |
|---|---|---|
| Classic | Pinned 0.1.0 first four light literals; same RGB/dark .30; other slots original Zhroma | Classic attribution adjacent to record |
| Catppuccin | Latte/Mocha; peach→orange, teal→cyan, mauve→purple, pink→magenta; RGB unchanged | NOTICE zhroma-catppuccin |
| Tokyo Night | Light/Night; Terminal Cyan→cyan, Terminal Magenta→purple; eighth magenta arithmetic channel mean of red and purple | NOTICE zhroma-tokyo-night |
| Dracula | Alucard/Dracula; Pink→magenta; missing blue arithmetic channel mean of cyan and purple | NOTICE zhroma-dracula |
| Nord | Same Aurora/Frost accents adapted by opacity per mode; cyan=nord8, blue=nord10, purple=nord15; magenta mean of nord11 and nord15 | source.notice on zhroma-nord |
| Gruvbox | faded/bright; aqua→cyan; eighth magenta [max(red.R,purple.R), (red.G+purple.G)/2, purple.B] | NOTICE zhroma-gruvbox |
| Solarized | Same eight accent seeds in each mode; violet→purple | NOTICE zhroma-solarized |
| Colourblind-safe | Project-original independent RGB search and mode-specific validated maps | Authorship/method comments and source beside record |

Primary fixed sources: [Catppuccin](https://github.com/catppuccin/catppuccin/tree/d09787dd98ca6fba08af5ef2ae94a7e09f17daca), [Tokyo Night](https://github.com/enkia/tokyo-night-vscode-theme/tree/7c0f11eaef322f293621ca7befe462214b7ea468), [Dracula](https://github.com/dracula/dracula-theme/tree/e22ebcc048b8aff586f9bc94db30ff5347070b42), [Nord](https://github.com/nordtheme/nord/tree/1cef71605416a222e57225b544540ce0fcec18d4), [Gruvbox port](https://github.com/ellisonleao/gruvbox.nvim/tree/154eb5ff5b96d0641307113fa385eaf0d36d9796), [Solarized](https://github.com/altercation/solarized/tree/62f656a02f93c5190a8753159e34b385588d5ff3). File paths and paired source/licence hashes are retained in runtime source metadata and the ordered manifest.

## Numerical minima and margins

Display-only rounded minima, over every required native state (and all simulations for Colourblind-safe). Acceptance uses complete unrounded checks below. Classic light pair and untinted numbers are frozen individual exceptions, not new-palette passes. Other minima have positive margins over floors 3/2/4.5/2; no floor was changed.

| Palette/mode | Pair | Untinted | Actual contrast | Native transition |
|---|---:|---:|---:|---:|
| Classic light | 1.9353605330 | 3.0608158060 | 8.5521399150 | 3.4070948780 |
| Classic dark | 4.7294162834 | 10.3319345211 | 6.3135916071 | 2.4082195304 |
| Catppuccin light | 3.0374697739 | 2.2876070782 | 8.9312825156 | 3.2220227003 |
| Catppuccin dark | 3.2165300549 | 3.5005794597 | 6.7408348185 | 3.3348240543 |
| Tokyo Night light | 3.0473570648 | 2.5295246250 | 7.8018329506 | 3.1083228465 |
| Tokyo Night dark | 3.0287623279 | 2.6786250302 | 7.2776408709 | 3.2400517686 |
| Dracula light | 3.3497982314 | 2.4106534237 | 8.0156765080 | 3.1830667558 |
| Dracula dark | 3.0091724052 | 2.3338338970 | 6.9515321172 | 3.4346919889 |
| Nord light | 3.0332339736 | 2.1903914902 | 8.2995287404 | 2.7865957782 |
| Nord dark | 3.1397713570 | 2.5346327113 | 6.7341688147 | 3.2371545685 |
| Gruvbox light | 3.0006686294 | 2.1930471937 | 7.8217147386 | 3.1993542011 |
| Gruvbox dark | 3.0781954884 | 2.1898020152 | 6.9604347234 | 3.2084393966 |
| Solarized light | 3.0774265647 | 2.1556549606 | 8.3591198619 | 3.2577457976 |
| Solarized dark | 3.2289433721 | 2.4031882292 | 7.9861795599 | 3.2004416659 |
| Colourblind-safe light | 3.0476106814 | 2.1536015047 | 6.1034506752 | 2.1030930898 |
| Colourblind-safe dark | 3.3100033019 | 3.7143297195 | 6.0435268392 | 2.9185829459 |

## Frozen Classic light floors

Exact individual floors from the immutable baseline, in each state. Pair order U/H, U/N, U/L, H/N, H/L, N/L; untinted order U/H/N/L. Only these comparisons permit 1e-6; exact literal identity is separately required.

```json
{
  "normal": {
    "pairs": [
      2.6631936463369152,
      4.852237563814167,
      5.6125770237121175,
      2.272002029032016,
      3.5120758245295614,
      1.9353605329854782
    ],
    "untinted": [
      7.606597641394557,
      5.363414797187536,
      3.474286826485214,
      3.571819178161923
    ]
  },
  "hover": {
    "pairs": [
      2.629036853502469,
      4.758940210592782,
      5.546257523794375,
      2.219147212345711,
      3.4981097345700727,
      1.9426338740659612
    ],
    "untinted": [
      7.263781885420907,
      5.094051739571575,
      3.284104354405727,
      3.314148388037317
    ]
  },
  "selected": {
    "pairs": [
      2.5955355675150846,
      4.667671502549116,
      5.481373614688321,
      2.1680971385883026,
      3.4836520362208248,
      1.946168705160742
    ],
    "untinted": [
      6.932097687049148,
      4.842031807968666,
      3.1138881625340598,
      3.0608158060028416
    ]
  }
}
```


## Required Colourblind-safe — PASS

Final variants JSON SHA256: `8af862f94cf8ac70b83b48f7800dbb2bc05ab38bbc04a7d3e298576d2d35bdb2`. Exact RGB, alpha and mappings below are project-original contributions. No third-party palette or repository-wide licence is asserted. Bundled authorship/method credit is in `extension/zhroma-themes.js` beside this record. The descriptive label denotes passed normal, protanopia and deuteranopia severity-1 simulation cases, not universal accessibility or endorsement.

```json
{
  "light": {
    "slots": {
      "red": {
        "rgb": [
          240,
          49,
          70
        ],
        "alpha": 0.12
      },
      "orange": {
        "rgb": [
          162,
          67,
          32
        ],
        "alpha": 0.12
      },
      "yellow": {
        "rgb": [
          111,
          129,
          42
        ],
        "alpha": 0.12
      },
      "green": {
        "rgb": [
          117,
          234,
          27
        ],
        "alpha": 0.1
      },
      "cyan": {
        "rgb": [
          96,
          212,
          186
        ],
        "alpha": 0.12
      },
      "blue": {
        "rgb": [
          76,
          151,
          227
        ],
        "alpha": 0.24
      },
      "purple": {
        "rgb": [
          219,
          110,
          231
        ],
        "alpha": 0.08
      },
      "magenta": {
        "rgb": [
          205,
          75,
          121
        ],
        "alpha": 0.44
      }
    },
    "priorities": {
      "Urgent": "magenta",
      "High": "blue",
      "Normal": "purple",
      "Low": "green"
    }
  },
  "dark": {
    "slots": {
      "red": {
        "rgb": [
          209,
          129,
          104
        ],
        "alpha": 0.22
      },
      "orange": {
        "rgb": [
          132,
          77,
          26
        ],
        "alpha": 0.12
      },
      "yellow": {
        "rgb": [
          238,
          235,
          114
        ],
        "alpha": 0.12
      },
      "green": {
        "rgb": [
          135,
          195,
          137
        ],
        "alpha": 0.08
      },
      "cyan": {
        "rgb": [
          20,
          220,
          232
        ],
        "alpha": 0.12
      },
      "blue": {
        "rgb": [
          99,
          204,
          252
        ],
        "alpha": 0.22
      },
      "purple": {
        "rgb": [
          174,
          35,
          210
        ],
        "alpha": 0.14
      },
      "magenta": {
        "rgb": [
          248,
          113,
          200
        ],
        "alpha": 0.12
      }
    },
    "priorities": {
      "Urgent": "blue",
      "High": "red",
      "Normal": "green",
      "Low": "purple"
    }
  }
}
```

## Reproducible generation

`generateCvdData()` in `test/extension/theme-validation.js` defines the full finite algorithm. Independent xorshift32 streams start at seeds 1514689103 (light) and 1514689104 (dark). RGB channels are uniform integers 0..255 constrained by eight named-slot channel inequalities. Each slot tries at most 4096 RGB proposals per batch, at most 128 batches per mode. Historical prototype RGB triples are a rejection-only denylist and never seeds. There are no copied third-party candidates.

For each eight-RGB batch, enumerate alpha .06..44 inclusive by .02 before changing RGB. Reject individual tints failing contrast, untinted difference or native transitions in any simulation/state. Sample four candidates at most 100000 times in stream order, reject duplicate slots, order by normal-state L, then require all six pairs and strict order in every simulation/state. First passing assignment wins; ties/non-strict orders fail. Unmapped slots retain alpha .12. This is finite deterministic feasibility search, not a claim of a global optimum. Both modes passed on their first RGB batch: light trial 0, pool 148; dark trial 14, pool 128. Mapping is exempt from the semantic ordinary-palette convention under D-10. No further opacity/hue changes were needed.

## Complete final CVD gates

Exact unrounded evidence follows. Pair order U/H, U/N, U/L, H/N, H/L, N/L. Four-element arrays use Urgent/High/Normal/Low order. Contrast is actual measured text against actual final RGB and is repeated for simulation rows; it is not claimed to be a simulated text-perception result. Simulation applies to final flattened colours. Native transitions are also checked in each simulation. Floors are pair 3, untinted/native 2, contrast 4.5; strict L ordering applies to all 18 state rows. Every value passed; no skips.

```json
[
  {
    "mode": "light",
    "simulation": "normal",
    "state": "normal",
    "pairs": [
      13.379191386429806,
      17.051680789040827,
      19.010800778503004,
      6.551036480316543,
      8.135829705185706,
      4.559664487845712
    ],
    "untinted": [
      19.846744086884673,
      8.856419779380598,
      2.965430653748682,
      3.6201391740464945
    ],
    "contrast": [
      7.11767766077724,
      10.240221184220944,
      12.071983905460371,
      12.395705339186799
    ],
    "lightness": [
      0.8147839915166583,
      0.9172268089779402,
      0.9748629762822885,
      0.9794928745370411
    ]
  },
  {
    "mode": "light",
    "simulation": "normal",
    "state": "hover",
    "pairs": [
      13.035881739052876,
      16.01467682135212,
      18.119871726987668,
      5.943318930601574,
      7.718034506524248,
      4.619279636360702
    ],
    "untinted": [
      18.56946133981781,
      7.96035762350434,
      2.7434486962540214,
      3.4895026302686225
    ],
    "contrast": [
      6.5975356362298525,
      9.391234179514756,
      10.917719464642827,
      11.252390021018057
    ],
    "lightness": [
      0.792426437941916,
      0.8890715995570337,
      0.9405703959330892,
      0.9461327468523295
    ]
  },
  {
    "mode": "light",
    "simulation": "normal",
    "state": "selected",
    "pairs": [
      12.713861853310258,
      15.00755848277667,
      17.25381961739789,
      5.329689196798385,
      7.3072684805066785,
      4.680647401787167
    ],
    "untinted": [
      17.327120277088564,
      7.054571793834266,
      2.5292888085024883,
      3.3982350167624196
    ],
    "contrast": [
      6.1034506751964495,
      8.59207160918307,
      9.839299572532761,
      10.181721252371334
    ],
    "lightness": [
      0.7699611720698813,
      0.860879869504437,
      0.9061519699611668,
      0.9126653251759657
    ]
  },
  {
    "mode": "light",
    "simulation": "normal",
    "transition": "normal→hover",
    "transitions": [
      2.3219144456155423,
      2.929951880323543,
      3.563274777840026,
      3.4515442001358325
    ]
  },
  {
    "mode": "light",
    "simulation": "normal",
    "transition": "hover→selected",
    "transitions": [
      2.335386473853969,
      2.9357493429268846,
      3.5798943051616474,
      3.4645761484975583
    ]
  },
  {
    "mode": "light",
    "simulation": "protanopia",
    "state": "normal",
    "pairs": [
      13.800625454396226,
      18.364605928482323,
      19.946160056918178,
      4.864487310946463,
      7.757160688248034,
      3.796475232526226
    ],
    "untinted": [
      21.255842578982833,
      7.912131833608626,
      3.049599645005445,
      3.0059446282368967
    ],
    "contrast": [
      7.11767766077724,
      10.240221184220944,
      12.071983905460371,
      12.395705339186799
    ],
    "lightness": [
      0.7880704784180754,
      0.9256578872817439,
      0.9716453121617232,
      0.9832163574967485
    ]
  },
  {
    "mode": "light",
    "simulation": "protanopia",
    "state": "hover",
    "pairs": [
      13.266246042760384,
      17.261022094715667,
      18.91855093994814,
      4.303479507986953,
      7.383893108418714,
      3.8938856802140154
    ],
    "untinted": [
      19.89090037865578,
      7.104354186778497,
      2.8029555077477406,
      2.9366797316976756
    ],
    "contrast": [
      6.5975356362298525,
      9.391234179514756,
      10.917719464642827,
      11.252390021018057
    ],
    "lightness": [
      0.7676894653717793,
      0.8998014309094428,
      0.9402810600042265,
      0.9527206554718702
    ]
  },
  {
    "mode": "light",
    "simulation": "protanopia",
    "state": "selected",
    "pairs": [
      12.736483542310506,
      16.156434246174125,
      17.87211140426792,
      3.735920975567677,
      7.0032108317019794,
      3.9858523397917365
    ],
    "untinted": [
      18.52166458832466,
      6.289134792226259,
      2.5553481870758685,
      2.91270624104681
    ],
    "contrast": [
      6.1034506751964495,
      8.59207160918307,
      9.839299572532761,
      10.181721252371334
    ],
    "lightness": [
      0.7472205423543853,
      0.8738781128507089,
      0.9087847987536231,
      0.9219584902735686
    ]
  },
  {
    "mode": "light",
    "simulation": "protanopia",
    "transition": "normal→hover",
    "transitions": [
      2.1030930897545588,
      2.666537144430716,
      3.2311926441636065,
      3.129615723438118
    ]
  },
  {
    "mode": "light",
    "simulation": "protanopia",
    "transition": "hover→selected",
    "transitions": [
      2.1135815858523275,
      2.6750332627700812,
      3.2470683150332453,
      3.1587508293097857
    ]
  },
  {
    "mode": "light",
    "simulation": "deuteranopia",
    "state": "normal",
    "pairs": [
      10.208054798068554,
      15.764502600039213,
      16.476423201332537,
      6.403031683920411,
      8.408107324548755,
      3.047610681404498
    ],
    "untinted": [
      18.286210798592773,
      9.0942101372049,
      2.6917068116357266,
      2.873592480230843
    ],
    "contrast": [
      7.11767766077724,
      10.240221184220944,
      12.071983905460371,
      12.395705339186799
    ],
    "lightness": [
      0.8171380320682049,
      0.9143860537739026,
      0.9745229799238432,
      0.9805818311995311
    ]
  },
  {
    "mode": "light",
    "simulation": "deuteranopia",
    "state": "hover",
    "pairs": [
      9.698174115593616,
      14.56739375175381,
      15.343380017866712,
      5.7660792154797536,
      7.9726042903098735,
      3.1596471578869507
    ],
    "untinted": [
      16.800509662461565,
      8.188250536616152,
      2.42255841128095,
      2.7474654326017403
    ],
    "contrast": [
      6.5975356362298525,
      9.391234179514756,
      10.917719464642827,
      11.252390021018057
    ],
    "lightness": [
      0.7941830720635742,
      0.8854815199677382,
      0.9393495687454447,
      0.946481051452711
    ]
  },
  {
    "mode": "light",
    "simulation": "deuteranopia",
    "state": "selected",
    "pairs": [
      9.207961878582031,
      13.380039492112807,
      14.211281557178982,
      5.118963859755272,
      7.542131944126712,
      3.279715341060381
    ],
    "untinted": [
      15.321240841495475,
      7.272311449083864,
      2.153601504655195,
      2.6793933328651263
    ],
    "contrast": [
      6.1034506751964495,
      8.59207160918307,
      9.839299572532761,
      10.181721252371334
    ],
    "lightness": [
      0.7711018992282619,
      0.8565219514220325,
      0.9040235955265198,
      0.912260694201582
    ]
  },
  {
    "mode": "light",
    "simulation": "deuteranopia",
    "transition": "normal→hover",
    "transitions": [
      2.3719795766843963,
      2.990022325973563,
      3.632444929910571,
      3.5062971135753136
    ]
  },
  {
    "mode": "light",
    "simulation": "deuteranopia",
    "transition": "hover→selected",
    "transitions": [
      2.387123235126932,
      2.9982133541550633,
      3.651742506168905,
      3.5209294359690535
    ]
  },
  {
    "mode": "dark",
    "simulation": "normal",
    "state": "normal",
    "pairs": [
      6.9056879026136215,
      10.01323694309812,
      11.99522132042166,
      6.92525526959724,
      8.909875114165368,
      6.270716501530693
    ],
    "untinted": [
      14.901300541590132,
      11.588963975075279,
      5.232189084586531,
      6.60232581735587
    ],
    "contrast": [
      7.779968864576429,
      9.050820725550658,
      11.012170501369669,
      11.568400254814996
    ],
    "lightness": [
      0.36038596772443166,
      0.3262599540979425,
      0.2655212542619499,
      0.2564105601529688
    ]
  },
  {
    "mode": "dark",
    "simulation": "normal",
    "state": "hover",
    "pairs": [
      6.771634184437099,
      9.228769560071882,
      11.510663507988685,
      6.1598128680367665,
      8.49479252633097,
      6.122437214470123
    ],
    "untinted": [
      13.574418571947419,
      10.278168978209246,
      4.707609273001791,
      5.91086950992176
    ],
    "contrast": [
      6.86067620615909,
      8.062427656990176,
      9.691295934929999,
      10.380266739428187
    ],
    "lightness": [
      0.39078377273003445,
      0.3556826455878847,
      0.3034944131791953,
      0.2907887454734615
    ]
  },
  {
    "mode": "dark",
    "simulation": "normal",
    "state": "selected",
    "pairs": [
      6.646467069780628,
      8.495036838389808,
      11.04090156306519,
      5.4870816708872665,
      8.101061180344127,
      6.006569231934331
    ],
    "untinted": [
      12.356699102454064,
      9.10831168338533,
      4.242499139954998,
      5.3540897111550665
    ],
    "contrast": [
      6.043526839245851,
      7.1488506755243995,
      8.432172632837972,
      9.195436573048545
    ],
    "lightness": [
      0.42060942429129583,
      0.38484232217781333,
      0.34044628738826405,
      0.3246764005469519
    ]
  },
  {
    "mode": "dark",
    "simulation": "normal",
    "transition": "normal→hover",
    "transitions": [
      3.0812683393990192,
      3.024621117816632,
      3.863677460955949,
      3.5250177705280668
    ]
  },
  {
    "mode": "dark",
    "simulation": "normal",
    "transition": "hover→selected",
    "transitions": [
      3.0227631117894624,
      2.9911366612212933,
      3.75649424664792,
      3.4627952679809915
    ]
  },
  {
    "mode": "dark",
    "simulation": "protanopia",
    "state": "normal",
    "pairs": [
      6.554906797515171,
      10.639353654742008,
      12.549882416721214,
      4.786935754570161,
      8.749417863249635,
      5.177081441668982
    ],
    "untinted": [
      15.689770947062689,
      10.149678721285866,
      5.36283131291074,
      5.030931950987192
    ],
    "contrast": [
      7.779968864576429,
      9.050820725550658,
      11.012170501369669,
      11.568400254814996
    ],
    "lightness": [
      0.373390641278962,
      0.31780879355420294,
      0.27053783510565155,
      0.24957732620361153
    ]
  },
  {
    "mode": "dark",
    "simulation": "protanopia",
    "state": "hover",
    "pairs": [
      6.477873243799942,
      9.801312536490475,
      12.01376423189164,
      4.011116639988313,
      8.302031863973516,
      5.180893999155764
    ],
    "untinted": [
      14.282403476077054,
      8.819521426942831,
      4.808810417036381,
      4.3976138771479665
    ],
    "contrast": [
      6.86067620615909,
      8.062427656990176,
      9.691295934929999,
      10.380266739428187
    ],
    "lightness": [
      0.405089556312773,
      0.349706324137019,
      0.31043622407182614,
      0.28679551274163484
    ]
  },
  {
    "mode": "dark",
    "simulation": "protanopia",
    "state": "selected",
    "pairs": [
      6.400178604377853,
      9.021748996182312,
      11.499981871507908,
      3.3100033019311192,
      7.890213274033803,
      5.1899083389468
    ],
    "untinted": [
      12.998383443347139,
      7.629073002994727,
      4.321374586153183,
      3.9051999604448357
    ],
    "contrast": [
      6.043526839245851,
      7.1488506755243995,
      8.432172632837972,
      9.195436573048545
    ],
    "lightness": [
      0.4361865593218078,
      0.38111588283924425,
      0.3491887040380459,
      0.32317171704493725
    ]
  },
  {
    "mode": "dark",
    "simulation": "protanopia",
    "transition": "normal→hover",
    "transitions": [
      3.1972230418830327,
      3.2339722144921144,
      4.034039907146098,
      3.7509582262769916
    ]
  },
  {
    "mode": "dark",
    "simulation": "protanopia",
    "transition": "hover→selected",
    "transitions": [
      3.1360739337744845,
      3.1814119118446302,
      3.91577748401867,
      3.6640564495062358
    ]
  },
  {
    "mode": "dark",
    "simulation": "deuteranopia",
    "state": "normal",
    "pairs": [
      5.4341957289299065,
      9.707312223519786,
      10.37128546968113,
      6.452178552703371,
      9.12619604128731,
      4.0043445208980595
    ],
    "untinted": [
      14.544182317467937,
      11.641930001311634,
      5.202122208823826,
      5.073562347861145
    ],
    "contrast": [
      7.779968864576429,
      9.050820725550658,
      11.012170501369669,
      11.568400254814996
    ],
    "lightness": [
      0.3568488033340268,
      0.3277509812905076,
      0.26493275083808565,
      0.2534052986193632
    ]
  },
  {
    "mode": "dark",
    "simulation": "deuteranopia",
    "state": "hover",
    "pairs": [
      5.378147066317738,
      8.940878090276671,
      10.019972765953678,
      5.637248605608476,
      8.755594745230976,
      4.099719603770607
    ],
    "untinted": [
      13.250956451947825,
      10.31974669417196,
      4.696907563719995,
      4.323250608761773
    ],
    "contrast": [
      6.86067620615909,
      8.062427656990176,
      9.691295934929999,
      10.380266739428187
    ],
    "lightness": [
      0.38676532470503877,
      0.3565467669077178,
      0.30228072585145993,
      0.28697813480023276
    ]
  },
  {
    "mode": "dark",
    "simulation": "deuteranopia",
    "state": "selected",
    "pairs": [
      5.320584720727673,
      8.22381576303907,
      9.651292194102206,
      4.907341101199723,
      8.391972952614491,
      4.1826984166946914
    ],
    "untinted": [
      12.060983514140508,
      9.135255469979974,
      4.2462134103483935,
      3.7143297194606295
    ],
    "contrast": [
      6.043526839245851,
      7.1488506755243995,
      8.432172632837972,
      9.195436573048545
    ],
    "lightness": [
      0.4161203486270975,
      0.3851062121863143,
      0.33862452243027463,
      0.3201573226628757
    ]
  },
  {
    "mode": "dark",
    "simulation": "deuteranopia",
    "transition": "normal→hover",
    "transitions": [
      3.030911560227987,
      2.9475311311880756,
      3.79674433734913,
      3.4188860012075897
    ]
  },
  {
    "mode": "dark",
    "simulation": "deuteranopia",
    "transition": "hover→selected",
    "transitions": [
      2.9734731887096864,
      2.91858294588361,
      3.6917722605751635,
      3.370538807829747
    ]
  }
]
```

## Evidence limits

The selected settled method and independent clipping/red/white/black/Oklab vectors passed before candidate admission. Source-bound tests execute all final cases and reproduce these variants exactly. Actual browser flattening, secondary/link/muted text and native focus/selection/sticky-header human recognition remain 08-05 work. Phase 6 custody and human gaps and inherited Phase 7 dispositions are preserved. Saving/application acknowledgements are outside numerical admission.

## Complete final ordinary data and gate reports

Exact values and arrays follow; no rounding feeds acceptance. All six pairs, four tint/untinted values, four actual contrasts and both four-priority native transitions are recorded per mode/state. The Colourblind-safe complete evidence appears above.

### Classic — PASS

Variants and complete executed gates:

```json
{
  "variants": {
    "light": {
      "slots": {
        "red": {
          "rgb": [
            220,
            38,
            38
          ],
          "alpha": 0.14
        },
        "orange": {
          "rgb": [
            234,
            88,
            12
          ],
          "alpha": 0.12
        },
        "yellow": {
          "rgb": [
            202,
            138,
            4
          ],
          "alpha": 0.09
        },
        "green": {
          "rgb": [
            22,
            163,
            74
          ],
          "alpha": 0.08
        },
        "cyan": {
          "rgb": [
            8,
            145,
            178
          ],
          "alpha": 0.1
        },
        "blue": {
          "rgb": [
            37,
            99,
            235
          ],
          "alpha": 0.1
        },
        "purple": {
          "rgb": [
            147,
            51,
            234
          ],
          "alpha": 0.1
        },
        "magenta": {
          "rgb": [
            219,
            39,
            119
          ],
          "alpha": 0.1
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    },
    "dark": {
      "slots": {
        "red": {
          "rgb": [
            220,
            38,
            38
          ],
          "alpha": 0.3
        },
        "orange": {
          "rgb": [
            234,
            88,
            12
          ],
          "alpha": 0.3
        },
        "yellow": {
          "rgb": [
            202,
            138,
            4
          ],
          "alpha": 0.3
        },
        "green": {
          "rgb": [
            22,
            163,
            74
          ],
          "alpha": 0.3
        },
        "cyan": {
          "rgb": [
            8,
            145,
            178
          ],
          "alpha": 0.3
        },
        "blue": {
          "rgb": [
            37,
            99,
            235
          ],
          "alpha": 0.3
        },
        "purple": {
          "rgb": [
            147,
            51,
            234
          ],
          "alpha": 0.3
        },
        "magenta": {
          "rgb": [
            219,
            39,
            119
          ],
          "alpha": 0.3
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    }
  },
  "checks": [
    {
      "mode": "light",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        2.6631936463369152,
        4.852237563814167,
        5.6125770237121175,
        2.272002029032016,
        3.5120758245295614,
        1.9353605329854782
      ],
      "untinted": [
        7.606597641394557,
        5.363414797187536,
        3.474286826485214,
        3.571819178161923
      ],
      "contrast": [
        10.487435946402977,
        11.265012532065251,
        11.953314190177279,
        11.944592300898258
      ],
      "lightness": [
        0.9293201516734805,
        0.9514141776171186,
        0.9697517604726495,
        0.9676562989854545
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        2.629036853502469,
        4.758940210592782,
        5.546257523794375,
        2.219147212345711,
        3.4981097345700727,
        1.9426338740659612
      ],
      "untinted": [
        7.263781885420907,
        5.094051739571575,
        3.284104354405727,
        3.314148388037317
      ],
      "contrast": [
        9.487249075091688,
        10.19748594381163,
        10.81491850761361,
        10.806371063078835
      ],
      "lightness": [
        0.8964643922252341,
        0.9180675347121438,
        0.9356426144734725,
        0.9335609720909537
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        2.5955355675150846,
        4.667671502549116,
        5.481373614688321,
        2.1680971385883026,
        3.4836520362208248,
        1.946168705160742
      ],
      "untinted": [
        6.932097687049148,
        4.842031807968666,
        3.1138881625340598,
        3.0608158060028416
      ],
      "contrast": [
        8.552139914989903,
        9.198852199323479,
        9.750683287356997,
        9.743427754896565
      ],
      "lightness": [
        0.8634431222624946,
        0.8845612308567169,
        0.9013910315456239,
        0.8993657333592813
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.407094878020674,
        3.454147663547909,
        3.5327731119879684,
        3.5343801489237285
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.427708263130157,
        3.473728468105404,
        3.5503157772325245,
        3.5471576735000383
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        4.729416283397041,
        9.189080166981642,
        13.701349575839911,
        4.800508978295319,
        10.954583121471005,
        7.429664818541607
      ],
      "untinted": [
        12.897304728608436,
        15.077923786411512,
        16.345281983292725,
        14.555139574595225
      ],
      "contrast": [
        9.812824430131554,
        8.602545194017438,
        7.795632810901569,
        8.121800583656482
      ],
      "lightness": [
        0.31124452025548904,
        0.34359944630429656,
        0.36306665888835377,
        0.3443677298726524
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        4.912230025380464,
        9.44384358439826,
        13.586240843960063,
        4.849892093400949,
        10.684829429551286,
        7.234161840062922
      ],
      "untinted": [
        11.476210824022827,
        13.525147870394996,
        14.870256070516158,
        13.072879129658139
      ],
      "contrast": [
        9.011140586928729,
        7.818128741317794,
        7.023459996138747,
        7.276239302459095
      ],
      "lightness": [
        0.33409986004390757,
        0.36715163331384765,
        0.38790389508988843,
        0.3713301941239238
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        5.0185785678827655,
        9.58625372141746,
        13.431978590108336,
        4.867764431113426,
        10.434965962144146,
        7.062733251940004
      ],
      "untinted": [
        10.331934521079116,
        12.19115799244678,
        13.566854606380794,
        11.743245636472675
      ],
      "contrast": [
        8.216250495254307,
        7.0737284377158405,
        6.313591607072301,
        6.506804270565982
      ],
      "lightness": [
        0.35752602517718624,
        0.3909793658351323,
        0.41270705352840464,
        0.39791844698374396
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        2.4082195304173357,
        2.432896864001267,
        2.529359468295443,
        2.738610039027774
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        2.459363662476675,
        2.463360126455322,
        2.52900099152612,
        2.701375974228841
      ]
    }
  ]
}
```

### Catppuccin — PASS

Variants and complete executed gates:

```json
{
  "variants": {
    "light": {
      "slots": {
        "red": {
          "rgb": [
            210,
            15,
            57
          ],
          "alpha": 0.1
        },
        "orange": {
          "rgb": [
            254,
            100,
            11
          ],
          "alpha": 0.06
        },
        "yellow": {
          "rgb": [
            223,
            142,
            29
          ],
          "alpha": 0.18
        },
        "green": {
          "rgb": [
            64,
            160,
            43
          ],
          "alpha": 0.12
        },
        "cyan": {
          "rgb": [
            23,
            146,
            153
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            30,
            102,
            245
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            136,
            57,
            239
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            234,
            118,
            203
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    },
    "dark": {
      "slots": {
        "red": {
          "rgb": [
            243,
            139,
            168
          ],
          "alpha": 0.14
        },
        "orange": {
          "rgb": [
            250,
            179,
            135
          ],
          "alpha": 0.06
        },
        "yellow": {
          "rgb": [
            249,
            226,
            175
          ],
          "alpha": 0.14
        },
        "green": {
          "rgb": [
            166,
            227,
            161
          ],
          "alpha": 0.1
        },
        "cyan": {
          "rgb": [
            148,
            226,
            213
          ],
          "alpha": 0.14
        },
        "blue": {
          "rgb": [
            137,
            180,
            250
          ],
          "alpha": 0.14
        },
        "purple": {
          "rgb": [
            203,
            166,
            247
          ],
          "alpha": 0.14
        },
        "magenta": {
          "rgb": [
            245,
            194,
            231
          ],
          "alpha": 0.14
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    }
  },
  "checks": [
    {
      "mode": "light",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        3.723040462984238,
        3.2698724501801455,
        4.204372676347619,
        3.8690144281871945,
        3.494879813873744,
        3.037469773858462
      ],
      "untinted": [
        5.945620433504985,
        2.5216708157563126,
        6.303985079871099,
        5.155833277194525
      ],
      "contrast": [
        11.00617873379249,
        12.212988978169426,
        11.093080247952644,
        11.4709552270391
      ],
      "lightness": [
        0.944733312880568,
        0.9779542315288081,
        0.94523881259819,
        0.9534798213896317
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        3.6312918476964313,
        3.38208891111507,
        4.240682637491922,
        3.614480116215936,
        3.3203771059781824,
        3.0464839819107614
      ],
      "untinted": [
        5.697680210057861,
        2.3994442702371397,
        5.918563903976684,
        4.804312191345775
      ],
      "contrast": [
        9.932891232191526,
        11.02180978518353,
        10.105101415569315,
        10.406863625442037
      ],
      "lightness": [
        0.9106490999623994,
        0.9427854255593567,
        0.9140821456194793,
        0.9206948456736117
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        3.540565558077613,
        3.5230081184058832,
        4.278701447691461,
        3.3964619713324713,
        3.1503614550690715,
        3.062643520106775
      ],
      "untinted": [
        5.455501965942363,
        2.2876070781745628,
        5.577815270040213,
        4.466256467084729
      ],
      "contrast": [
        8.931282515618713,
        9.91006536783421,
        9.17685611734008,
        9.411228061968874
      ],
      "lightness": [
        0.8764072781238601,
        0.9074666085927188,
        0.8827803549774764,
        0.8878096361271934
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.537733239747462,
        3.6459816194827015,
        3.222022700291453,
        3.3949763172396494
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.5577935801364986,
        3.6647825465736923,
        3.239332323767436,
        3.4074251281920183
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        4.594241950063957,
        4.073428172138907,
        3.5753631720350896,
        7.410942703774682,
        3.718393057248459,
        4.204304865425872
      ],
      "untinted": [
        8.7424006095319,
        4.3439344427221975,
        11.713476972826484,
        7.7606444689047
      ],
      "contrast": [
        10.008006394333126,
        11.361127376530739,
        8.817504759784326,
        10.137045768611927
      ],
      "lightness": [
        0.29868187430066,
        0.2568847330434277,
        0.33050606326883436,
        0.2905458886995257
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        4.109730200532248,
        4.001222936872276,
        3.3753071743967173,
        6.881462279044892,
        3.4700568887092365,
        3.898956112732826
      ],
      "untinted": [
        7.791277455805351,
        3.890754496980474,
        10.731017459337128,
        7.075074720758774
      ],
      "contrast": [
        8.843005853077152,
        10.020933006569804,
        7.725461033881042,
        8.88039654285137
      ],
      "lightness": [
        0.332239493633728,
        0.2955253407013951,
        0.36374297264173827,
        0.3268818374826421
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        3.67528444320965,
        3.929335772187898,
        3.2165300548534335,
        6.394485241194689,
        3.240376735467994,
        3.626358195190873
      ],
      "untinted": [
        6.952200044935462,
        3.5005794596669415,
        9.85321814541948,
        6.46508510451629
      ],
      "contrast": [
        7.753690724462314,
        8.721072289400755,
        6.740834818541235,
        7.717449234979316
      ],
      "lightness": [
        0.36530648265747984,
        0.3332057399320832,
        0.3964372123595731,
        0.36236318317374516
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.4422685852563415,
        3.9439297985171704,
        3.3942647909137023,
        3.6980138736186654
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.3831379602246905,
        3.839145313910268,
        3.334824054319911,
        3.608281579370166
      ]
    }
  ]
}
```

### Tokyo Night — PASS

Variants and complete executed gates:

```json
{
  "variants": {
    "light": {
      "slots": {
        "red": {
          "rgb": [
            140,
            67,
            81
          ],
          "alpha": 0.12
        },
        "orange": {
          "rgb": [
            150,
            80,
            39
          ],
          "alpha": 0.22
        },
        "yellow": {
          "rgb": [
            143,
            94,
            21
          ],
          "alpha": 0.06
        },
        "green": {
          "rgb": [
            56,
            95,
            13
          ],
          "alpha": 0.16
        },
        "cyan": {
          "rgb": [
            15,
            75,
            110
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            41,
            89,
            170
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            90,
            62,
            142
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            115,
            64.5,
            111.5
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    },
    "dark": {
      "slots": {
        "red": {
          "rgb": [
            247,
            118,
            142
          ],
          "alpha": 0.06
        },
        "orange": {
          "rgb": [
            255,
            158,
            100
          ],
          "alpha": 0.16
        },
        "yellow": {
          "rgb": [
            224,
            175,
            104
          ],
          "alpha": 0.1
        },
        "green": {
          "rgb": [
            158,
            206,
            106
          ],
          "alpha": 0.14
        },
        "cyan": {
          "rgb": [
            125,
            207,
            255
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            122,
            162,
            247
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            187,
            154,
            247
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            217,
            136,
            194.5
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    }
  },
  "checks": [
    {
      "mode": "light",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        4.875861130737371,
        3.4100059121349107,
        3.5653225433325395,
        7.998307201877145,
        3.2150379626824774,
        5.949386588546146
      ],
      "untinted": [
        6.1115999658990106,
        10.834636261875499,
        2.856239634059387,
        8.731088390883816
      ],
      "contrast": [
        10.890201837269734,
        9.447768752116273,
        12.036101822566154,
        10.182121836350998
      ],
      "lightness": [
        0.9396632974170724,
        0.8937135824742872,
        0.972215005271554,
        0.9147297778713643
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        4.617728200787141,
        3.23016366675061,
        3.4801193758965523,
        7.531724765068773,
        3.127925393732004,
        5.631166159827314
      ],
      "untinted": [
        5.7508083708339175,
        10.20037640256989,
        2.690385602947643,
        8.241434659339909
      ],
      "contrast": [
        9.852119862214332,
        8.598553289853172,
        10.859832416768855,
        9.23617114920488
      ],
      "lightness": [
        0.9064743448728089,
        0.8637029360370369,
        0.9371313226222096,
        0.8830072470740972
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        4.371729098575457,
        3.0512982310752648,
        3.397933638525107,
        7.074542499660777,
        3.0473570648283146,
        5.314857739118303
      ],
      "untinted": [
        5.393803914898742,
        9.580280634536042,
        2.529524624950262,
        7.758207625129115
      ],
      "contrast": [
        8.882242053696963,
        7.8018329505957205,
        9.762612000857098,
        8.351400076144579
      ],
      "lightness": [
        0.8731535086589515,
        0.8335552104125343,
        0.901912237330795,
        0.8511766775526057
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.444378518953835,
        3.1083228465229116,
        3.638060838941758,
        3.285053165083634
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.4612860126390546,
        3.125107180338437,
        3.655218497151416,
        3.298422215141752
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        7.307518128918241,
        3.653515648792001,
        6.998774092083409,
        4.010105339722525,
        3.368077723132521,
        3.4653735096286673
      ],
      "untinted": [
        3.4871453874751905,
        10.6250955623445,
        6.728284101685585,
        9.753771720834443
      ],
      "contrast": [
        11.721528573001414,
        9.37045829724186,
        10.574543216991014,
        9.51038723603603
      ],
      "lightness": [
        0.24704022362517503,
        0.3162331668280785,
        0.27966947028612016,
        0.30801576280816145
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        6.683650354888895,
        3.402521908419783,
        6.5393871355295214,
        3.633590635349378,
        3.1821487445278427,
        3.253526872636022
      ],
      "untinted": [
        3.0495409628150436,
        9.559452752010637,
        6.042230152020337,
        8.875204482669412
      ],
      "contrast": [
        10.389185758855636,
        8.282425898896932,
        9.314007586687154,
        8.35353530372734
      ],
      "lightness": [
        0.28587610796652396,
        0.34818923916128985,
        0.31574782868091433,
        0.3420624746858769
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        6.120502277419328,
        3.174782647987986,
        6.1165310749824435,
        3.297678274215219,
        3.0287623279454436,
        3.0555638433573553
      ],
      "untinted": [
        2.6786250301693864,
        8.620730646083064,
        5.443143454571571,
        8.091438885300523
      ],
      "contrast": [
        9.071405101519591,
        7.27764087089698,
        8.123710456479456,
        7.295205221323447
      ],
      "lightness": [
        0.32375522083077457,
        0.3798079237065325,
        0.3511017256776394,
        0.37543979967286284
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.968710483522294,
        3.2811197936830245,
        3.685933463257257,
        3.46664055055207
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.861932967846164,
        3.240051768634921,
        3.6062741479077753,
        3.396888498443482
      ]
    }
  ]
}
```

### Dracula — PASS

Variants and complete executed gates:

```json
{
  "variants": {
    "light": {
      "slots": {
        "red": {
          "rgb": [
            203,
            58,
            42
          ],
          "alpha": 0.12
        },
        "orange": {
          "rgb": [
            163,
            77,
            20
          ],
          "alpha": 0.2
        },
        "yellow": {
          "rgb": [
            132,
            110,
            21
          ],
          "alpha": 0.06
        },
        "green": {
          "rgb": [
            20,
            113,
            10
          ],
          "alpha": 0.12
        },
        "cyan": {
          "rgb": [
            3,
            106,
            150
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            51.5,
            90,
            175.5
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            100,
            74,
            201
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            163,
            20,
            77
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    },
    "dark": {
      "slots": {
        "red": {
          "rgb": [
            255,
            85,
            85
          ],
          "alpha": 0.06
        },
        "orange": {
          "rgb": [
            255,
            184,
            108
          ],
          "alpha": 0.08
        },
        "yellow": {
          "rgb": [
            241,
            250,
            140
          ],
          "alpha": 0.12
        },
        "green": {
          "rgb": [
            80,
            250,
            123
          ],
          "alpha": 0.1
        },
        "cyan": {
          "rgb": [
            139,
            233,
            253
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            164,
            190,
            251
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            189,
            147,
            249
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            255,
            121,
            198
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    }
  },
  "checks": [
    {
      "mode": "light",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        4.096360269441447,
        3.6050775180330557,
        3.416484409169533,
        7.279197685859137,
        4.575516537227261,
        3.986426094147202
      ],
      "untinted": [
        6.072640139440639,
        9.961898599694518,
        2.7384756982201806,
        6.599872475579915
      ],
      "contrast": [
        10.95062916290878,
        9.73677154377617,
        12.093612382431532,
        10.921086868066675
      ],
      "lightness": [
        0.9423951601513213,
        0.9034409631787274,
        0.9735800435961791,
        0.9371910951433956
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        3.8725765862434063,
        3.4752566723231535,
        3.4099273509102654,
        6.9028828287412285,
        4.449099928453218,
        3.7909262763999876
      ],
      "untinted": [
        5.763574809167961,
        9.415277611411778,
        2.571723953340247,
        6.229222666821715
      ],
      "contrast": [
        9.903475796655435,
        8.848450762769554,
        10.914595801860386,
        9.889741151025587
      ],
      "lightness": [
        0.9090297662277212,
        0.8726959585744423,
        0.9385341331948529,
        0.9042731588241205
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        3.65633119787835,
        3.3497982313605923,
        3.398252634355752,
        6.537500973062148,
        4.33040765224213,
        3.5952136901294693
      ],
      "untinted": [
        5.4640822648025535,
        8.884904183472603,
        2.4106534237047117,
        5.863269125406062
      ],
      "contrast": [
        8.924813341183938,
        8.015676507994149,
        9.814660418724799,
        8.926224353018895
      ],
      "lightness": [
        0.8755101411159198,
        0.8418038689883525,
        0.9033558606436614,
        0.8712539152608014
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.4599353007746254,
        3.1830667558421446,
        3.633702373006622,
        3.4094726010748095
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.479242052306221,
        3.200937021887624,
        3.650454500296394,
        3.422129873893916
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        3.3313732173609245,
        8.400661091639124,
        6.4971692740253255,
        5.080111729135078,
        3.6546149385972546,
        3.648391248501855
      ],
      "untinted": [
        3.1029851739464145,
        5.9125611110480945,
        10.831387154824464,
        8.145234949953888
      ],
      "contrast": [
        11.930955615916755,
        10.862692892582746,
        9.136184294615438,
        10.104988165933763
      ],
      "lightness": [
        0.24091340092544636,
        0.2715115522727394,
        0.3199051619216545,
        0.2894062539372996
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        3.164310767954652,
        7.959324353596592,
        6.1752064578292565,
        4.804888863745315,
        3.47268274680652,
        3.4208570527279707
      ],
      "untinted": [
        2.6790603585414257,
        5.323318895531611,
        9.97204678064088,
        7.477122394265892
      ],
      "contrast": [
        10.612572503458065,
        9.565429681062279,
        7.989445851604682,
        8.847272428913397
      ],
      "lightness": [
        0.2796871894122624,
        0.3086259019353222,
        0.3542208219565804,
        0.3258680331915393
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        3.009172405176014,
        7.548808355682604,
        5.8820792665957375,
        4.548559399289822,
        3.3137280142287473,
        3.226652575032892
      ],
      "untinted": [
        2.333833896974931,
        4.814233017147191,
        9.209241013108183,
        6.885906119773437
      ],
      "contrast": [
        9.290284139830923,
        8.329364744145842,
        6.951532117221197,
        7.685608308977691
      ],
      "lightness": [
        0.31757253989151873,
        0.3449567770695975,
        0.38792638781559047,
        0.3614412065510248
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.969690313598758,
        3.792594072636932,
        3.499542190314904,
        3.705182005762922
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.867788091476851,
        3.706059707232727,
        3.43469198886355,
        3.613823553641201
      ]
    }
  ]
}
```

### Nord — PASS

Variants and complete executed gates:

```json
{
  "variants": {
    "light": {
      "slots": {
        "red": {
          "rgb": [
            191,
            97,
            106
          ],
          "alpha": 0.14
        },
        "orange": {
          "rgb": [
            208,
            135,
            112
          ],
          "alpha": 0.3
        },
        "yellow": {
          "rgb": [
            235,
            203,
            139
          ],
          "alpha": 0.16
        },
        "green": {
          "rgb": [
            163,
            190,
            140
          ],
          "alpha": 0.28
        },
        "cyan": {
          "rgb": [
            136,
            192,
            208
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            94,
            129,
            172
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            180,
            142,
            173
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            185.5,
            119.5,
            139.5
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    },
    "dark": {
      "slots": {
        "red": {
          "rgb": [
            191,
            97,
            106
          ],
          "alpha": 0.18
        },
        "orange": {
          "rgb": [
            208,
            135,
            112
          ],
          "alpha": 0.06
        },
        "yellow": {
          "rgb": [
            235,
            203,
            139
          ],
          "alpha": 0.16
        },
        "green": {
          "rgb": [
            163,
            190,
            140
          ],
          "alpha": 0.12
        },
        "cyan": {
          "rgb": [
            136,
            192,
            208
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            94,
            129,
            172
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            180,
            142,
            173
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            185.5,
            119.5,
            139.5
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    }
  },
  "checks": [
    {
      "mode": "light",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        3.9918648150519056,
        3.638218819863391,
        3.125871812063805,
        7.159112530946789,
        4.4092305170397275,
        4.294042963269558
      ],
      "untinted": [
        5.742984755367938,
        9.623487268388818,
        2.7795274783782427,
        6.720058941106865
      ],
      "contrast": [
        11.028605408515466,
        9.829081240506753,
        12.185075377394902,
        10.868136356337107
      ],
      "lightness": [
        0.9444002300743541,
        0.9073696007725136,
        0.9763450206812594,
        0.9359303647914706
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        3.5580383960191253,
        3.7446143674381607,
        3.0332339735724654,
        6.748544685066647,
        4.407054456701907,
        3.8673943695927018
      ],
      "untinted": [
        5.334123507684893,
        8.746747319664987,
        2.4324583831714284,
        5.8299812171497996
      ],
      "contrast": [
        10.002791912873695,
        9.042929290405608,
        11.119570096640464,
        10.019750742145318
      ],
      "lightness": [
        0.9119210170016848,
        0.8804678721906716,
        0.9449463392799987,
        0.9089197107203989
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        3.173543600062651,
        3.853402792676318,
        3.0478607789244654,
        6.345189443548007,
        4.4047958270565495,
        3.4440227722176053
      ],
      "untinted": [
        4.934935854118638,
        7.911658288006115,
        2.190391490222996,
        4.9952984277301615
      ],
      "contrast": [
        9.042398739994239,
        8.299528740432327,
        10.11755428456791,
        9.216974927022763
      ],
      "lightness": [
        0.8793069351668732,
        0.8534504729324939,
        0.9134296703306696,
        0.8818322498356486
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.3701066798957817,
        2.7865957782352844,
        3.2528848423926324,
        2.7967617047466407
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.3872467373565467,
        2.8007283107878207,
        3.2674838580721928,
        2.806225021543744
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        4.66360415225969,
        5.171319006927525,
        3.2572728088844984,
        8.780297198647492,
        4.714801262446498,
        4.339050008572292
      ],
      "untinted": [
        7.885805896251482,
        3.300446180131942,
        12.026044747792247,
        7.825558104971858
      ],
      "contrast": [
        10.368544554510876,
        11.712529695743923,
        8.746421199795162,
        10.11721931965394
      ],
      "lightness": [
        0.2885328311390825,
        0.24644757465431327,
        0.33272012638339443,
        0.2916244425196855
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        4.023077150977576,
        5.156460774171843,
        3.1763771557929164,
        8.127215089586334,
        4.347953116448773,
        4.039034749316394
      ],
      "untinted": [
        6.819987833774112,
        2.8885883375220898,
        10.961062801638533,
        7.0524957089535985
      ],
      "contrast": [
        9.248868818247324,
        10.373473670875859,
        7.689728531725328,
        8.891850997429389
      ],
      "lightness": [
        0.3205017288156465,
        0.2855003852015612,
        0.36495663347799207,
        0.32702586139459666
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        3.4610422971229315,
        5.1370687686424485,
        3.1397713569991046,
        7.530007256428248,
        4.0102714788132126,
        3.770346062973122
      ],
      "untinted": [
        5.887269501770708,
        2.534632711276265,
        10.008485123540853,
        6.362193218338534
      ],
      "contrast": [
        8.182037895467078,
        9.052191943071689,
        6.7341688147145,
        7.75458152127935
      ],
      "lightness": [
        0.3520832141962846,
        0.3235240633617939,
        0.396722467645969,
        0.3616427040611599
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.286481361016838,
        3.985198718933459,
        3.294793504196822,
        3.605893396528336
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.237154568504664,
        3.8730370603720807,
        3.242870127499119,
        3.5227234406226993
      ]
    }
  ]
}
```

### Gruvbox — PASS

Variants and complete executed gates:

```json
{
  "variants": {
    "light": {
      "slots": {
        "red": {
          "rgb": [
            157,
            0,
            6
          ],
          "alpha": 0.08
        },
        "orange": {
          "rgb": [
            175,
            58,
            3
          ],
          "alpha": 0.2
        },
        "yellow": {
          "rgb": [
            181,
            118,
            20
          ],
          "alpha": 0.06
        },
        "green": {
          "rgb": [
            121,
            116,
            14
          ],
          "alpha": 0.18
        },
        "cyan": {
          "rgb": [
            66,
            123,
            88
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            7,
            102,
            120
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            143,
            63,
            113
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            157,
            31.5,
            113
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    },
    "dark": {
      "slots": {
        "red": {
          "rgb": [
            251,
            73,
            52
          ],
          "alpha": 0.06
        },
        "orange": {
          "rgb": [
            254,
            128,
            25
          ],
          "alpha": 0.14
        },
        "yellow": {
          "rgb": [
            250,
            189,
            47
          ],
          "alpha": 0.16
        },
        "green": {
          "rgb": [
            184,
            187,
            38
          ],
          "alpha": 0.08
        },
        "cyan": {
          "rgb": [
            142,
            192,
            124
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            131,
            165,
            152
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            211,
            134,
            155
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            251,
            103.5,
            155
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    }
  },
  "checks": [
    {
      "mode": "light",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        5.5366765808100515,
        3.0615464323037114,
        3.975736407856805,
        8.284720167486908,
        3.5570737242315733,
        5.86426454775556
      ],
      "untinted": [
        5.290597587534417,
        10.709543004127285,
        2.4838052672414235,
        8.305478213729728
      ],
      "contrast": [
        11.18210580244407,
        9.523601939525062,
        12.196719795704633,
        10.348592254294012
      ],
      "lightness": [
        0.9488830356160927,
        0.8972167608583558,
        0.9767670558275151,
        0.9206237681969167
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        5.237126213369574,
        3.0306921685235735,
        3.775900115957848,
        7.9213358778803675,
        3.551839968195663,
        5.513561768575585
      ],
      "untinted": [
        5.086031386954236,
        10.188896515402318,
        2.334022165850787,
        7.800776502803466
      ],
      "contrast": [
        10.077757278564578,
        8.644944005113844,
        11.009733076403116,
        9.410056358604985
      ],
      "lightness": [
        0.9141801657417037,
        0.8663085092244958,
        0.9416937822099987,
        0.8895196562028221
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        4.95405708219208,
        3.0006686293699705,
        3.6055851032991706,
        7.567687479067163,
        3.546878159119272,
        5.17255646422317
      ],
      "untinted": [
        4.885303410441963,
        9.684857170551105,
        2.1930471936752873,
        7.3141662704993475
      ],
      "contrast": [
        9.04835231903841,
        7.821714738574627,
        9.902022006677463,
        8.53021287136965
      ],
      "lightness": [
        0.8793253744412356,
        0.8352397059000555,
        0.9064823022548599,
        0.8582928672977009
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.6005559477846214,
        3.1993542010979272,
        3.6361354965571517,
        3.2182378835229617
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.6198620923728124,
        3.2187578771789904,
        3.6535406654380465,
        3.2330662584063536
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        5.828051072071194,
        9.485292253474881,
        3.673488866825135,
        3.9637437128328,
        3.745433070541568,
        6.498068950426032
      ],
      "untinted": [
        2.9168305790586295,
        8.493838496060405,
        11.890069354251791,
        5.494904041370265
      ],
      "contrast": [
        12.026331767591792,
        10.277548181369829,
        8.990284154057283,
        11.053562676731303
      ],
      "lightness": [
        0.23791671111394874,
        0.2901096577709578,
        0.32551914605982707,
        0.2644411725506724
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        5.345447756903626,
        8.880214953419689,
        3.5149549207797164,
        3.846773042576865,
        3.377826698374905,
        5.9873218363577445
      ],
      "untinted": [
        2.5113012378457062,
        7.596052633257871,
        10.869044085837064,
        4.9805070689165225
      ],
      "contrast": [
        10.714181872364364,
        9.123311623077157,
        7.929834425289186,
        9.745505045707505
      ],
      "lightness": [
        0.2767021095714802,
        0.32301038238326246,
        0.35724940543073486,
        0.3019620126672252
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        4.913625586376431,
        8.318856340500886,
        3.3648701920630018,
        3.7249861519027387,
        3.078195488368184,
        5.528979454849405
      ],
      "untinted": [
        2.189802015167361,
        6.830859840353601,
        9.968034748882651,
        4.5359196523726855
      ],
      "contrast": [
        9.389830027748614,
        8.026984746122007,
        6.960434723435959,
        8.491696133678293
      ],
      "lightness": [
        0.3146188456868445,
        0.35563451012735414,
        0.3886487834391927,
        0.3386085932481452
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.9730558512621785,
        3.380464823319096,
        3.2429502742678467,
        3.8251945042081776
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.8726589931434097,
        3.3462639366192426,
        3.208439396585433,
        3.732653970408183
      ]
    }
  ]
}
```

### Solarized — PASS

Variants and complete executed gates:

```json
{
  "variants": {
    "light": {
      "slots": {
        "red": {
          "rgb": [
            220,
            50,
            47
          ],
          "alpha": 0.1
        },
        "orange": {
          "rgb": [
            203,
            75,
            22
          ],
          "alpha": 0.18
        },
        "yellow": {
          "rgb": [
            181,
            137,
            0
          ],
          "alpha": 0.06
        },
        "green": {
          "rgb": [
            133,
            153,
            0
          ],
          "alpha": 0.14
        },
        "cyan": {
          "rgb": [
            42,
            161,
            152
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            38,
            139,
            210
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            108,
            113,
            196
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            211,
            54,
            130
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    },
    "dark": {
      "slots": {
        "red": {
          "rgb": [
            220,
            50,
            47
          ],
          "alpha": 0.08
        },
        "orange": {
          "rgb": [
            203,
            75,
            22
          ],
          "alpha": 0.18
        },
        "yellow": {
          "rgb": [
            181,
            137,
            0
          ],
          "alpha": 0.16
        },
        "green": {
          "rgb": [
            133,
            153,
            0
          ],
          "alpha": 0.08
        },
        "cyan": {
          "rgb": [
            42,
            161,
            152
          ],
          "alpha": 0.12
        },
        "blue": {
          "rgb": [
            38,
            139,
            210
          ],
          "alpha": 0.12
        },
        "purple": {
          "rgb": [
            108,
            113,
            196
          ],
          "alpha": 0.12
        },
        "magenta": {
          "rgb": [
            211,
            54,
            130
          ],
          "alpha": 0.12
        }
      },
      "priorities": {
        "Urgent": "red",
        "High": "orange",
        "Normal": "yellow",
        "Low": "green"
      }
    }
  },
  "checks": [
    {
      "mode": "light",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        3.629807574314752,
        3.259230860548401,
        3.5143516488598854,
        6.423785950068858,
        4.470222418355341,
        3.452003667694702
      ],
      "untinted": [
        5.147819127901315,
        8.630183919792984,
        2.4100940417669485,
        5.798919479756185
      ],
      "contrast": [
        11.267973975634256,
        10.176005962291034,
        12.27464283256908,
        11.311905056514705
      ],
      "lightness": [
        0.9519695769070021,
        0.9185819423382892,
        0.9786655792388606,
        0.9494482259233681
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        3.4358440458861104,
        3.1818527565986616,
        3.540009619426658,
        6.121971715861141,
        4.42466699677907,
        3.257056817366947
      ],
      "untinted": [
        4.899733448649481,
        8.175473777094492,
        2.276844887544307,
        5.466647443043419
      ],
      "contrast": [
        10.179007565203907,
        9.238111544043397,
        11.083064567612734,
        10.273810626672917
      ],
      "lightness": [
        0.917958378045908,
        0.8871198104187049,
        0.9436120366632179,
        0.9171335482630067
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        3.2542261372698986,
        3.106162815311393,
        3.574683907898224,
        5.829976689097191,
        4.3802020068022935,
        3.0774265646685137
      ],
      "untinted": [
        4.6597531785831485,
        7.739667461891625,
        2.155654960622142,
        5.161792691799452
      ],
      "contrast": [
        9.162003486894143,
        8.35911986185241,
        9.970840513691913,
        9.301212405777857
      ],
      "lightness": [
        0.8837916377084193,
        0.8554985383837744,
        0.9084207068098205,
        0.88469602205624
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.52789496879317,
        3.257745797554394,
        3.6329039638792957,
        3.3425187615069962
      ]
    },
    {
      "mode": "light",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.547482291702806,
        3.277086370412231,
        3.6501469353297393,
        3.357300682233317
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "normal",
      "pairs": [
        4.526917589242101,
        6.436624548498209,
        3.457004924246217,
        3.4547584598773127,
        4.602294604819691,
        4.28531951337872
      ],
      "untinted": [
        3.2351692943115804,
        7.523385891299887,
        8.545984064852188,
        4.410870880859554
      ],
      "contrast": [
        12.035848566100354,
        10.779845883784274,
        10.210033331692554,
        11.474034314841669
      ],
      "lightness": [
        0.2382711826839909,
        0.2769890731725226,
        0.2896520610799474,
        0.2517121101189855
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "hover",
      "pairs": [
        4.033485495442527,
        6.079075553720355,
        3.3383909134090026,
        3.4483415029459756,
        4.14155255933287,
        3.8651702787997704
      ],
      "untinted": [
        2.763635495360109,
        6.5438324766882685,
        7.698818362657464,
        3.9745648507969835
      ],
      "contrast": [
        10.762522736126186,
        9.679208536406337,
        9.066171778731205,
        10.160352048493694
      ],
      "lightness": [
        0.2759204929289827,
        0.3082058879969237,
        0.3223640893769993,
        0.2897341359011825
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "state": "selected",
      "pairs": [
        3.607905445062301,
        5.7352685107004415,
        3.2289433721483123,
        3.4256043772086504,
        3.7924232185393434,
        3.50165317072431
      ],
      "untinted": [
        2.40318822922987,
        5.742799430848798,
        6.968975929299259,
        3.603367932078631
      ],
      "contrast": [
        9.471120546992717,
        8.60538848244568,
        7.986179559929971,
        8.87781339878877
      ],
      "lightness": [
        0.31284780013239805,
        0.33929800535346666,
        0.35465375309364594,
        0.3267970917308075
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "normal→hover",
      "transitions": [
        3.8648190730324417,
        3.2223422919834475,
        3.338941563589547,
        3.873884873286725
      ]
    },
    {
      "mode": "dark",
      "simulation": "normal",
      "transition": "hover→selected",
      "transitions": [
        3.777523596423355,
        3.20044166593966,
        3.2960650302313454,
        3.7732251241047297
      ]
    }
  ]
}
```

