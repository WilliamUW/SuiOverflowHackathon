// Copyright (c) 2022, Sui Foundation
// SPDX-License-Identifier: Apache-2.0

/// A basic Hello World example for Sui Move, part of the Sui Move intro course:
/// https://github.com/sui-foundation/sui-move-intro-course
///
module hello_world::hello_world;

use std::string;
use std::vector;
use sui::object::{Self, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::clock;
use sui::coin::{Self, Coin, TreasuryCap, CoinMetadata};
use sui::balance::{Self, Balance};
use std::option;
use sui::table::{Self, Table};

/// Structure to store interview data
public struct InterviewData has store, copy, drop {
    user_address: address,
    company_name: string::String,
    interview_question: string::String,
    timestamp: u64,
}

/// Structure to store interview history
public struct InterviewHistory has key {
    id: UID,
    interviews: vector<InterviewData>,
}

/// Structure to track user reward balances
public struct RewardBalance has key {
    id: UID,
    balances: Table<address, u64>,
}


/// Function to initialize the interview history
public fun init_interview_history(ctx: &mut TxContext) {
    let interview_history = InterviewHistory {
        id: object::new(ctx),
        interviews: vector::empty(),
    };
    transfer::share_object(interview_history);
}

/// Function to initialize the reward balance table
public fun init_reward_balance(ctx: &mut TxContext) {
    let reward_balance = RewardBalance {
        id: object::new(ctx),
        balances: table::new(ctx),
    };
    transfer::share_object(reward_balance);
}


/// Function to store interview data and increment reward balance
public fun store_interview(
    interview_history: &mut InterviewHistory,
    reward_balance: &mut RewardBalance,
    company_name: string::String,
    interview_question: string::String,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    let interview_data = InterviewData {
        user_address: sender,
        company_name,
        interview_question,
        timestamp: 0,
    };
    vector::push_back(&mut interview_history.interviews, interview_data);

    // Update reward balance
    if (table::contains(&reward_balance.balances, sender)) {
        let current = table::borrow_mut(&mut reward_balance.balances, sender);
        *current = *current + 1;
    } else {
        table::add(&mut reward_balance.balances, sender, 1);
    }
}

/// Function to get the number of interviews
public fun get_interview_count(interview_history: &InterviewHistory): u64 {
    vector::length(&interview_history.interviews)
}

/// Function to get interview data at a specific index
public fun get_interview(interview_history: &InterviewHistory, index: u64): InterviewData {
    assert!(index < vector::length(&interview_history.interviews), 0);
    *vector::borrow(&interview_history.interviews, index)
}

/// Function to get a user's reward balance
public fun get_reward_balance(reward_balance: &RewardBalance, user: address): u64 {
    if (table::contains(&reward_balance.balances, user)) {
        *table::borrow(&reward_balance.balances, user)
    } else {
        0
    }
}
