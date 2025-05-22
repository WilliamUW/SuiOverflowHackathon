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
use sui::coin::{Self, Coin, TreasuryCap};
use sui::balance::{Self, Balance};

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

/// BBT token type
public struct BBT has drop {}

/// Function to initialize the module
fun init(ctx: &mut TxContext) {
    // Create BBT token
    let (treasury_cap, metadata) = coin::create_currency(
        BBT {},
        9, // decimals
        b"BBT", // symbol
        b"Behavioral Buddy Token", // name
        b"Token rewarded for sharing interview questions", // description
        option::none(), // url
        ctx
    );
    
    // Transfer treasury cap to module publisher
    transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
    // Make metadata immutable and share it
    transfer::public_transfer(metadata, tx_context::sender(ctx));

    // Initialize interview history
    let interview_history = InterviewHistory {
        id: object::new(ctx),
        interviews: vector::empty(),
    };
    transfer::share_object(interview_history);
}

/// Function to store interview data and mint BBT reward
public fun store_interview(
    interview_history: &mut InterviewHistory,
    company_name: string::String,
    interview_question: string::String,
    treasury_cap: &mut TreasuryCap<BBT>,
    ctx: &mut TxContext,
) {
    let interview_data = InterviewData {
        user_address: tx_context::sender(ctx),
        company_name,
        interview_question,
        timestamp: 0,
    };
    vector::push_back(&mut interview_history.interviews, interview_data);

    // Mint 1 BBT token as reward
    let reward = coin::mint(treasury_cap, 1000000000, ctx); // 1 BBT (with 9 decimals)
    transfer::public_transfer(reward, tx_context::sender(ctx));
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
