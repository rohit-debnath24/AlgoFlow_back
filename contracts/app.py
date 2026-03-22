from pyteal import *

APP_NAME = "AlgoForgeLite"

# Global state keys
g_total_jobs = Bytes("total_jobs")
g_total_failures = Bytes("total_failures")

# Local (per node) state keys
l_reputation = Bytes("rep")
l_success = Bytes("s")
l_fail = Bytes("f")

# ABI methods

def approval():
    on_create = Seq(
        App.globalPut(g_total_jobs, Int(0)),
        App.globalPut(g_total_failures, Int(0)),
        Approve(),
    )

    on_opt_in = Seq(
        App.localPut(Txn.sender(), l_reputation, Int(0)),
        App.localPut(Txn.sender(), l_success, Int(0)),
        App.localPut(Txn.sender(), l_fail, Int(0)),
        Approve(),
    )

    status = Btoi(Txn.application_args[1])  # 1 = success, 0 = fail
    payout = Btoi(Txn.application_args[2])

    on_submit = Seq(
        App.globalPut(g_total_jobs, App.globalGet(g_total_jobs) + Int(1)),
        If(status == Int(1))
        .Then(
            Seq(
                App.localPut(Txn.sender(), l_success, App.localGet(Txn.sender(), l_success) + Int(1)),
                App.localPut(Txn.sender(), l_reputation, App.localGet(Txn.sender(), l_reputation) + Int(1)),
                If(payout > Int(0)).Then(
                    InnerTxnBuilder.Execute(
                        {
                            TxnField.type_enum: TxnType.Payment,
                            TxnField.amount: payout,
                            TxnField.receiver: Txn.sender(),
                        }
                    )
                ),
                Approve(),
            )
        )
        .Else(
            Seq(
                App.globalPut(g_total_failures, App.globalGet(g_total_failures) + Int(1)),
                App.localPut(Txn.sender(), l_fail, App.localGet(Txn.sender(), l_fail) + Int(1)),
                App.localPut(Txn.sender(), l_reputation, App.localGet(Txn.sender(), l_reputation) - Int(1)),
                Approve(),
            )
        )
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, on_opt_in],
        [Txn.on_completion() == OnComplete.DeleteApplication, Reject()],
        [Txn.application_args[0] == Bytes("submit"), on_submit],
    )
    return program


def clear():
    return Approve()


if __name__ == "__main__":
    print(compileTeal(approval(), mode=Mode.Application, version=6))
