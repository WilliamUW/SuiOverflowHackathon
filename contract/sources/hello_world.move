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

/// Function to initialize the module
fun init(ctx: &mut TxContext) {
    let interview_history = InterviewHistory {
        id: object::new(ctx),
        interviews: vector::empty(),
    };
    transfer::share_object(interview_history);
}

/// Function to store interview data
public fun store_interview(
    interview_history: &mut InterviewHistory,
    company_name: string::String,
    interview_question: string::String,
    ctx: &mut TxContext,
) {
    let interview_data = InterviewData {
        user_address: tx_context::sender(ctx),
        company_name,
        interview_question,
        timestamp: 0,
    };
    vector::push_back(&mut interview_history.interviews, interview_data);
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
