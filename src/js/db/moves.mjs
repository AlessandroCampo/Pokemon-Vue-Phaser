import { allAnimations } from "./animations.mjs"

class Move {
    constructor({ name, type, category, power, accuracy, pp, makes_contact, description, animation, effects }) {
        this.name = name
        this.type = type
        this.category = category || 'Physical'
        this.power = power
        this.accuracy = accuracy || 100
        this.pp = pp
        this.makes_contact = makes_contact || true
        this.description = description || ''
        this.animation = animation || null
        this.effects = effects || null
    }
}

// NORMAL TYPE MOVES

const tackle = new Move({
    name: 'Tackle',
    category: 'physical',
    type: 'normal',
    power: 40,
    accuracy: 100,
    pp: {
        max: 35,
        current: 35
    },
    makes_contact: true,
    animation: allAnimations.tackle_animation,
    description: 'A physical attack in which the user charges and slams into the target with its whole body.',
    effects: null
})

const growl = new Move({
    name: 'Growl',
    category: 'physical',
    type: 'normal',
    power: null,
    accuracy: 100,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: false,
    animation: null,
    description: 'The user growls in an endearing way, making opposing Pokémon less wary. This lowers their Attack stats.',
    effects: [{ type: 'modify_stat', target_stat: 'atk', target: 'enemy', stages: -1, target_stat_label: 'attack' }]
})

const self_destruct = new Move({
    name: 'Self Destruct',
    category: 'physical',
    type: 'normal',
    power: 200,
    accuracy: 100,
    pp: {
        max: 5,
        current: 5
    },
    makes_contact: false,
    animation: null,
    description: 'The user attacks everything around it by causing an explosion. The user faints upon using this move.',
    effects: [{ type: 'self_faint' }]
})

const recover = new Move({
    name: 'Recover ',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 200,
    pp: {
        max: 5,
        current: 5
    },
    makes_contact: false,
    animation: null,
    description: 'Restoring its own cells, the user restores its own HP by half of its max HP.',
    effects: [{ type: 'heal', amount: 0.5 }]
})


const dobule_team = new Move({
    name: 'Double Team ',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'By moving rapidly, the user makes illusory copies of itself to boost its evasiveness.',
    effects: [{ type: 'modify_stat', target_stat: 'evasion', target: 'ally', stages: +1, target_stat_label: 'evasiveness' }]
})

const smoke_screen = new Move({
    name: 'Smoke Screen',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user releases an obscuring cloud of smoke or ink. This lowers the target’s accuracy.',
    effects: [{ type: 'modify_stat', target_stat: 'accuracy', target: 'enemy', stages: -1, target_stat_label: 'accuracy' }]
})

const supersonic = new Move({

    name: 'Supersonic ',
    category: 'status',
    type: 'normal',
    power: null,
    accuracy: 155,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user generates odd sound waves from its body that confuse the target.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 100 }]
})

// WATERTYPE MOVES 
const water_gun = new Move({
    name: 'Water Gun',
    category: 'special',
    type: 'water',
    power: 40,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'The target is blasted with a forceful shot of water.',

})

const withdraw = new Move({
    name: 'Withdraw ',
    category: 'status',
    type: 'water',
    power: null,
    accuracy: 100,
    pp: {
        max: 40,
        current: 40
    },
    makes_contact: false,
    animation: null,
    description: 'The user withdraws its body into its hard shell, boosting its Defense stat.',
    effects: [{ type: 'modify_stat', target_stat: 'def', target: 'ally', stages: +1, target_stat_label: 'defense' }]
})

// FIRE TYPE MOVES

const flame_charge = new Move({
    name: 'Flame Charge',
    category: 'physical',
    type: 'fire',
    power: 50,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'Cloaking itself in flame, the user attacks the target. Then, building up momentum, the user boosts its Speed stat.',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'ally', stages: +1, target_stat_label: 'speed' }]

})

const ember = new Move({
    name: 'Ember',
    category: 'special',
    type: 'fire',
    power: 40,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'The target is attacked with small flames. This may also leave the target with a burn.',
    effects: [{ type: 'apply_status', applied_status: 'burned', target: 'enemy', chance: 10 }]

})

// GRASS TYPE

const mega_drain = new Move({
    name: 'Mega Drain',
    category: 'special',
    type: 'grass',
    power: 40,
    accuracy: 100,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'A nutrient-draining attack. The user’s HP is restored by up to half the damage taken by the target.',
    effects: [{ type: 'drain', target: 'ally', amount: 0.5 }]

})

const giga_drain = new Move({
    name: 'Giga Drain',
    category: 'special',
    type: 'grass',
    power: 75,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'A nutrient-draining attack. The user’s HP is restored by up to half the damage taken by the target.',
    effects: [{ type: 'drain', target: 'ally', amount: 0.5 }]

})

//PSYCHIC TYPE

const hypnosis = new Move({
    name: 'Hypnosis',
    category: 'special',
    type: 'psychic',
    power: null,
    accuracy: 60,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user employs hypnotic suggestion to make the target fall asleep.',
    effects: [{ type: 'apply_status', applied_status: 'asleep', target: 'enemy', chance: 100 }]

})

const confusion = new Move({
    name: 'Confusion ',
    category: 'special',
    type: 'psychic',
    power: 50,
    accuracy: 100,
    pp: {
        max: 25,
        current: 25
    },
    makes_contact: false,
    animation: null,
    description: 'The target is hit by a weak telekinetic force. This may also confuse the target.',
    effects: [{ type: 'apply_confusion', applied_status: 'confused', target: 'enemy', chance: 10 }]

})

const moonlight = new Move({
    name: 'Moonlight ',
    category: 'status',
    type: 'psychic',
    power: null,
    accuracy: 200,
    pp: {
        max: 5,
        current: 5
    },
    makes_contact: false,
    animation: null,
    description: 'The user restores its own HP. The amount of HP regained varies with the weather.',
    effects: [{ type: 'heal', amount: 0.5 }]
})

// FIGHTINING TYPE MOVES

const seismic_toss = new Move({
    name: 'Seismic Toss',
    category: 'physical',
    type: 'normal',
    power: 1,
    accuracy: 100,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: true,
    animation: null,
    description: 'The target is thrown using the power of gravity. It inflicts damage equal to the user’s level.',
    effects: null
})

// ELECTRIC MOVES

const thunder_wave = new Move({
    name: 'Thunder Wave',
    category: 'status',
    type: 'electric',
    power: null,
    accuracy: 90,
    pp: {
        max: 20,
        current: 20
    },
    makes_contact: false,
    animation: null,
    description: 'The user launches a weak jolt of electricity that paralyzes the target.',
    effects: [{ type: 'apply_status', applied_status: 'paralyzed', target: 'enemy', chance: 100 }]

})

//ROCK MOVES

const rock_trhow = new Move({
    name: 'Rock Throw',
    category: 'physical',
    type: 'rock',
    power: 50,
    accuracy: 90,
    pp: {
        max: 15,
        current: 15
    },
    makes_contact: false,
    animation: null,
    description: 'The user picks up and throws a small rock at the target to attack..',
    effects: null
})

const rock_slide = new Move({
    name: 'Rock Slide',
    category: 'physical',
    type: 'rock',
    power: 50,
    accuracy: 90,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'Large boulders are hurled at opposing Pokémon to inflict damage. This may also make the opposing Pokémon flinch.',
    effects: [{ type: 'apply_flinch', applied_status: 'flinch', target: 'enemy', chance: 30 }]
})

const rock_tomb = new Move({
    name: 'Rock Tomb',
    category: 'physical',
    type: 'rock',
    power: 60,
    accuracy: 95,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'Boulders are hurled at the target. This also lowers the target’s Speed stat by preventing its movement.',
    effects: [{ type: 'modify_stat', target_stat: 'speed', target: 'enemy', stages: -1, target_stat_label: 'speed' }]
})



// ICE MOVES 

const ice_beam = new Move({
    name: 'Ice Beam',
    category: 'special',
    type: 'fire',
    power: 90,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'The target is struck with an icy-cold beam of energy. This may also leave the target frozen.',
    effects: [{ type: 'apply_status', applied_status: 'frozen', target: 'enemy', chance: 10 }]

})

// POISON  MOVES

const sludge_bomb = new Move({
    name: 'Sludge Bomb',
    category: 'special',
    type: 'fire',
    power: 90,
    accuracy: 100,
    pp: {
        max: 10,
        current: 10
    },
    makes_contact: false,
    animation: null,
    description: 'Unsanitary sludge is hurled at the target. This may also poison the target.',
    effects: [{ type: 'apply_status', applied_status: 'poisoned', target: 'enemy', chance: 30 }]

})

export const all_moves = {
    tackle,
    growl,
    water_gun,
    withdraw,
    dobule_team,
    smoke_screen,
    flame_charge,
    ember,
    mega_drain,
    supersonic,
    self_destruct,
    thunder_wave,
    seismic_toss,
    rock_trhow,
    hypnosis,
    confusion,
    rock_slide,
    ice_beam,
    sludge_bomb,
    giga_drain,
    moonlight,
    recover,
    rock_tomb

}