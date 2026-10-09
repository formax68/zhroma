# Phase 08 preset admission report

Task 2 numerical admission; optional candidate accounting is completed in Task 3. Native Chrome and human acceptance remain pending.

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

